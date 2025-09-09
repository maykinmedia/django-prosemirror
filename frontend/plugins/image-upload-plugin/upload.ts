import { Attrs, Schema } from "prosemirror-model";
import { EditorView } from "prosemirror-view";
import { insertImage } from "@/utils";
import crelt from "crelt";
import { ImageDOMAttrs, ImageNodeAttrs } from "@/schema/nodes/image";
import { getCSRFToken } from "@/utils/csrf";

export type UploadOptions = {
    attrs: Attrs;
    view: EditorView;
    schema: Schema;
};

export type FilerResponseBody = {
    alt_text: string | null;
    caption: string | null;
    file_size: number;
    id: string;
    mime_type: string;
    name: string;
    original_filename: string;
    title: string;
    uploaded_at: string;
    url: string;
    description: string;
};

/**
 * CRUD handler to manupilate images inside the filer.
 */
export class UploadImage {
    /**
     * The base endpoint used to send/get data.
     */
    private readonly endpoint?: string;

    constructor(endpoint: string | undefined) {
        this.endpoint = endpoint;
    }

    private readonly errors = {
        fetch: (imageId?: string) =>
            `Failed to fetch image data${imageId ? ` for image: ${imageId}` : ""}`,
        patch: (imageId?: string) =>
            `Failed to update image data${imageId ? ` for image: ${imageId}` : ""}`,
        upload: (fileName?: string) =>
            `Failed to upload file${fileName ? `: ${fileName}` : ""}`,
        noEndpoint: "Upload failed: No endpoint configured",
        patchFailed: "Image update failed",
        uploadAborted: "Image upload was aborted",
        multipleUploadFailed: "Multiple file upload failed:",
    };

    /**
     * Upload image file(s) and insert into view
     * @param files - Single File or array of Files to upload
     * @param options - Upload options
     * @returns Promise with image attributes for single file, or boolean for multiple files with view insertion
     */
    async uploadAndInsertFiles(files: File[], view?: EditorView) {
        let firstResult = null;
        let successCount = 0;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            try {
                // Perform the HTTP upload
                const res = await this.post(file);

                const imageAttrs: ImageNodeAttrs = {
                    alt: res.description,
                    caption: res.caption,
                    imageId: res.id,
                    src: res.url,
                    title: res.title,
                };

                successCount++;

                // Store first result for return value
                if (i === 0) {
                    firstResult = imageAttrs;
                }

                // If view and schema provided, insert into view
                if (view && imageAttrs.src) insertImage(imageAttrs, view);
            } catch (err) {
                console.error(this.errors.upload(file.name), err);
                // Return error object for failed uploads
                if (i === 0) {
                    firstResult = { src: "", title: "", alt: "" };
                }
            }
        }

        // Log warning for partial success in multiple file uploads
        if (
            files.length > 1 &&
            successCount > 0 &&
            successCount < files.length
        ) {
            console.warn(
                `Only ${successCount} of ${files.length} files uploaded successfully`,
            );
        }

        // Log error for complete failure in multiple file uploads
        if (files.length > 1 && successCount === 0) {
            console.error(
                this.errors.multipleUploadFailed,
                "All uploads failed",
            );
        }

        // Return first image attributes for single file, or boolean for multiple files
        return files.length === 1 ? firstResult : successCount > 0;
    }

    /**
     * Update existing image attributes via PATCH request
     */
    async getImageAttributes(imageId: string): Promise<FilerResponseBody> {
        try {
            return await this.get(imageId);
        } catch (err) {
            console.error(this.errors.fetch(imageId), err);
            return { id: imageId } as FilerResponseBody;
        }
    }

    /**
     * Update existing image attributes via PATCH request
     */
    async updateImageAttributes(attrs: ImageDOMAttrs, view: EditorView) {
        try {
            // Perform the HTTP upload
            const res = await this.patch(attrs ?? {});

            const imageAttrs: ImageNodeAttrs = {
                title: res.name,
                alt: res.description,
                imageId: res.id,
                caption: res.caption,
                src: res.url,
            };

            // If view and schema provided, insert into view
            if (view && imageAttrs.src) insertImage(imageAttrs, view);
        } catch (err) {
            console.error(this.errors.patchFailed, err);
        }
    }

    /**
     * Create file input and handle image upload with automatic insertion into view
     */
    uploadImage(view: EditorView): boolean {
        const fileInput = crelt("input", {
            type: "file",
            accept: "image/*",
            hidden: true,
        }) as HTMLInputElement;

        fileInput.onchange = (e) => {
            const files = Array.from(
                (e.target as HTMLInputElement).files || [],
            );
            this.uploadAndInsertFiles(files, view);
            document.body.removeChild(fileInput);
        };

        fileInput.oncancel = () => document.body.removeChild(fileInput);

        document.body.appendChild(fileInput);

        fileInput.click();
        return true;
    }

    /**
     * Post (CREATE) a new image to the filer.
     */
    private async post(file: File) {
        // Prepare and send data
        const formData = new FormData();
        formData.append("upload_file", file);

        // TODO implement `destination_path`.
        // formData.append("destination_path", "/");

        return this.send<FilerResponseBody>(
            "POST",
            this.errors.upload(file.name),
            this.endpoint,
            formData,
        );
    }

    /**
     * Get (READ) the attributes of an image.
     */
    private async get(imageId: string) {
        const endpoint = this.endpoint + imageId + "/";
        return this.send(
            "GET",
            this.errors.fetch(imageId),
            endpoint,
            undefined,
        );
    }

    /**
     * Patch (UPDATE) the attributes of an image.
     */
    private async patch(data: ImageDOMAttrs) {
        const endpoint = this.endpoint + data.id + "/";

        // Prepare URL-encoded data for Django backend (works better with request.POST parsing)
        const params = new URLSearchParams();
        if (data.title) params.append("name", data.title);
        if (data.alt) params.append("description", data.alt);
        if (data.caption) params.append("default_caption", data.caption);

        return this.send(
            "PATCH", // Change to POST so Django populates request.POST
            this.errors.patch(data.id),
            endpoint,
            params.toString(), // Send as URL-encoded string
        );
    }

    /**
     * Send the GET/POST/PATCH request.
     * @param method The method to use.
     * @param genericError The generic error to log on error.
     * @param endpoint The endpoint of the request.
     * @param body The request body.
     */
    private async send<R extends FilerResponseBody>(
        method: "POST" | "GET" | "PATCH" = "POST",
        genericError: string,
        endpoint?: string,
        /** Body only used if defined and method is not GET or HEAD */
        body?: XMLHttpRequestBodyInit | null,
    ) {
        return new Promise<R>((resolve, reject) => {
            if (!this.endpoint || !endpoint)
                return reject(this.errors.noEndpoint);

            const xhr = new XMLHttpRequest();
            xhr.open(method, endpoint, true);
            xhr.responseType = "json";
            xhr.withCredentials = true;

            // Set content type based on body type
            if (typeof body === "string") {
                xhr.setRequestHeader(
                    "Content-Type",
                    "application/x-www-form-urlencoded",
                );
            }

            xhr.addEventListener("load", () => {
                const response = xhr.response;
                if (!response || response.error) {
                    reject(new Error(response?.error?.message || genericError));
                } else {
                    resolve(response);
                }
            });

            xhr.addEventListener("error", () =>
                reject(new Error(genericError)),
            );
            xhr.addEventListener("abort", () =>
                reject(new Error(this.errors.uploadAborted)),
            );

            // Add CSRF token if available
            const csrfToken = getCSRFToken();

            if (csrfToken) xhr.setRequestHeader("X-CSRFToken", csrfToken);

            xhr.send(body);
        });
    }
}
