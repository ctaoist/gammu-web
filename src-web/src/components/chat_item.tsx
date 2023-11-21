import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { parseTime } from '../services/utils';

export const ChatItem = (props: any) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // const bgcolor = props.sms.sent ? '#6fbf73' : '#e0e0e0';
  const textcolor = props.sms.sent ? 'white' : 'black';
  const timeColor = props.sms.sent ? "#e0e0e0" : 'black';
  // const flex = props.sms.sent ? "right" : 'left';

  const bgcolor = props.sms.sent ? 'primary' : 'info';
  const flex = props.sms.sent ? "end" : 'start';

  return (
    <div className={`chat chat-${flex} mb-2`}>
      <div className={`chat-bubble chat-bubble-${bgcolor}`}>{props.sms.text}</div>
      <div className="chat-footer opacity-50">{parseTime(props.sms.time)}</div>
    </div>
  );
}

export default ChatItem;