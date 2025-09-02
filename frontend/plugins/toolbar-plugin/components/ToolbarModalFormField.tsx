import { FunctionComponent as FC } from "preact";
import { IToolbarModalFormFieldProps } from "../types";

export const ToolbarModalFormField: FC<IToolbarModalFormFieldProps> = ({
    label,
    name,
    value,
    onChange,
    type = "text",
    required = false,
    placeholder,
}) => {
    if (type === "hidden") {
        return <input type="hidden" name={name} value={value} />;
    }

    return (
        <div>
            <label style={{ display: "block" }} htmlFor={name}>
                {label}
            </label>
            {type === "textarea" ? (
                <textarea
                    name={name}
                    value={value}
                    id={name}
                    onChange={(e) => onChange(e.currentTarget.value)}
                    required={required}
                    placeholder={placeholder}
                />
            ) : (
                <input
                    type={type}
                    name={name}
                    value={value}
                    id={name}
                    onChange={(e) => onChange(e.currentTarget.value)}
                    required={required}
                    placeholder={placeholder}
                />
            )}
        </div>
    );
};
