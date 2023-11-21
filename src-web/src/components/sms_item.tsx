import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { parseTime } from '../services/utils';

export const SMSItem = (props: any) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const itemClicked = () => {
    navigate("/sms_chat", { state: { number: props.sms.number, smsScrollTo: document.documentElement.scrollTop || window.pageYOffset || document.body.scrollTop } })
  };

  return (<a className="" onClick={itemClicked}>
    <div className="card bg-base-100 shadow-xl border-2">
      <div className="card-body">
        <div className="flex justify-between"><h2 className="text-xl">{props.sms.number}</h2><div className="text-gray-400">{parseTime(props.sms.time, false)}</div></div>
        {props.sms.text.split('\n').map((e: string, i: number) => (
          <p key={i} className="text-gray-500">{e}</p>
        ))}
      </div>
    </div>
  </a>);
}