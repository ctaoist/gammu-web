import { useNavigate } from "react-router-dom";

import { SMSMessage, delSMS } from "../services/sms";

export const DelSMS = (props: any) => {
  const navigate = useNavigate();
  const list = props.sms?.smsList || [];

  const delSms = () => {
    delSMS(props.number).then(resp => {
      if (resp.retCode !== 0) { console.log(resp.errorMsg); }
      else if (list.length > 0) {
        props.setSmsList && props.setSmsList(list.filter((e: SMSMessage) => {
          return e.number != props.number;
        }));
      } else {
        navigate('/sms', { state: { smsScrollTo: props.loc } });
      }
    });
  }

  return (
    <button className="btn btn-outline m-0 p-2" onClick={delSms}><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M7 21q-.825 0-1.413-.588T5 19V6H4V4h5V3h6v1h5v2h-1v13q0 .825-.588 1.413T17 21H7ZM17 6H7v13h10V6ZM9 17h2V8H9v9Zm4 0h2V8h-2v9ZM7 6v13V6Z" /></svg></button>
  );
}