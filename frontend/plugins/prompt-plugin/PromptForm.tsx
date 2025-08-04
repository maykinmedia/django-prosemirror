import { ComponentChildren, FunctionComponent as FC } from "preact";
import { forwardRef } from "preact/compat";
import PromptActions from "./PromptActions";

interface IPromptFormProps {
    enctype?: "multipart/form-data";
    handleSubmit: VoidFunction;
    children: ComponentChildren;
    title?: string;
    onDestroy: VoidFunction;
    hideButtons?: boolean;
}

const PromptForm: FC<IPromptFormProps> = ({
    children,
    ref,
    handleSubmit,
    title,
    onDestroy,
    hideButtons,
}) => {
    return (
        <form
            ref={ref}
            enctype="multipart/form-data"
            className="prompt-form"
            onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
            }}
        >
            {title && <h4 className="prompt-title">{title}</h4>}
            {children}
            <PromptActions hideButtons={hideButtons} onDestroy={onDestroy} />
        </form>
    );
};

const PromptFormWithRef = forwardRef(PromptForm);

export default PromptFormWithRef;

export { PromptFormWithRef as PromptForm };
