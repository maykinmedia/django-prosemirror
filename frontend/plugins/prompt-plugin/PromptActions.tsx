import { translate } from "@/i18n/translations";
import { FunctionComponent as FC } from "preact";

interface IPromptActionsProps {
    hideButtons?: boolean;
    onDestroy: VoidFunction;
}

const PromptActions: FC<IPromptActionsProps> = ({ onDestroy, hideButtons }) => {
    if (hideButtons) return <></>;
    return (
        <div className="prompt-buttons">
            <button type="submit" className="prompt-submit">
                {translate("OK")}
            </button>
            <button type="button" className="prompt-cancel" onClick={onDestroy}>
                {translate("Cancel")}
            </button>
        </div>
    );
};

export default PromptActions;
