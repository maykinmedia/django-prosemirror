import { FunctionComponent as FC } from "preact";

export interface ITextFieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    error?: string | null;
}

/**
 * Text input field for prompts
 */
export const TextField: FC<ITextFieldProps> = ({
    label,
    value,
    onChange,
    placeholder,
    required = false,
    error,
}) => {
    return (
        <div>
            <label>
                {label}
                {required && " *"}
            </label>
            <input
                type="text"
                value={value}
                placeholder={placeholder}
                onInput={({ target }) =>
                    onChange((target as HTMLInputElement).value)
                }
                required={required}
            />
            {error && <div className="prompt-invalid">{error}</div>}
        </div>
    );
};
