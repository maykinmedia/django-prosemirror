import { Attrs } from "prosemirror-model";

const BACKEND_UPLOAD_URL = "/prosemirror/filer-upload-handler/";

/**
 * This should be a registered plugin.
 * Based on this plugin the other plugins should behave.
 * If this plugin is defined and returns a falsy then the other dependent plugins do not work.
 * If this plugin is undefined the othed dependent plugins should not work.
 */

export async function uploadImage(file: File, attrs?: Attrs) {
    try {
        const loader = { file: Promise.resolve(file) };
        const adapter = new FilerImageAdapter(loader);
        const url = (await adapter.upload()).default;

        return {
            src: url,
            title: attrs?.title ?? file?.name,
            alt: attrs?.alt,
        };
    } catch (err) {
        console.error("Image upload failed \n", err);
        return { src: "", title: "", alt: "" };
    }
}

export default class FilerImageAdapter {
    xhr: XMLHttpRequest;
    loader: {
        file: Promise<File>;
        uploadTotal?: number;
        uploaded?: number;
    };
    reader: FileReader;
    constructor(loader: { file: Promise<File> }) {
        // The file loader instance to use during the upload.
        this.loader = loader;
        this.xhr = new XMLHttpRequest();
        this.reader = new FileReader();
    }

    // Starts the upload process.
    async upload() {
        return this.loader.file.then(
            (file) =>
                new Promise<{ default: string }>((resolve, reject) => {
                    this._initRequest();
                    this._initListeners(resolve, reject, file);
                    this._sendRequest(file);
                }),
        );
    }

    // Initializes the XMLHttpRequest object using the URL passed to the constructor.
    _initRequest() {
        const xhr = (this.xhr = new XMLHttpRequest());

        xhr.open("POST", BACKEND_UPLOAD_URL, true);
        xhr.responseType = "json";
    }

    // Initializes XMLHttpRequest listeners.
    _initListeners(
        resolve: CallableFunction,
        reject: CallableFunction,
        file: File,
    ) {
        const xhr = this.xhr;
        const loader = this.loader;
        const genericErrorText = `Couldn't upload file: ${file.name}.`;

        // Fall back to image blob
        xhr.addEventListener("error", () => {
            return reject(genericErrorText);
        });
        xhr.addEventListener("abort", () => reject());
        xhr.addEventListener("load", () => {
            const response = xhr.response;

            if (!response || response.error) {
                return reject(
                    response && response.error
                        ? response.error.message
                        : genericErrorText,
                );
            }

            // If the upload is successful, resolve the upload promise with an object containing
            // at least the "default" URL, pointing to the image on the server.
            resolve({
                default: response.url,
            });
        });

        // Upload progress when it is supported.
        if (xhr.upload) {
            xhr.upload.addEventListener("progress", (evt) => {
                if (evt.lengthComputable) {
                    loader.uploadTotal = evt.total;
                    loader.uploaded = evt.loaded;
                }
            });
        }
    }

    _sendRequest(file: File) {
        this.xhr.withCredentials = true;

        // Prepare the form data.
        const data = new FormData();
        data.append("upload_file", file);
        // data.append("destination_path", "/test"); // Same as backend

        // add csrf token to the headers
        const csrftoken = document.querySelector<HTMLInputElement>(
            "[name=csrfmiddlewaretoken]",
        )?.value;
        if (csrftoken) {
            this.xhr.setRequestHeader("X-CSRFToken", csrftoken);
        }

        // Send the request.
        this.xhr.send(data);
    }
    // Aborts the upload process.
    abort() {
        // Reject the promise returned from the upload() method.
        if (this.xhr) {
            this.xhr.abort();
        }
    }
}
