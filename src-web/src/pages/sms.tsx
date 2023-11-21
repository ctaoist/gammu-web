import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Footer } from '../components/footer';
import { SMSItem } from '../components/sms_item';
import { DelSMS } from '../components/del_sms';
import { SMSMessage, getPhoneInfo, getSMSAbstract } from '../services/sms';
import { Global } from '../services/global';
import { WS } from '../services/ws';
import { checkLogStatus } from '../services/login';

export const SMSPage = () => {
  checkLogStatus();

  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [smsList, setSmsList] = useState<SMSMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [moreLabel, setMoreLabel] = useState("Load More");
  const [page, setPage] = useState(0);

  if (WS != null) {
    WS.onmessage = (ev) => {
      let data = JSON.parse(ev.data);
      if (data.type === "heartbeat") { return; }
      console.log(data);
      setSmsList(preSmsList => {
        let m: SMSMessage = data.msg;
        let pos = preSmsList.map(e => e.number).indexOf(m.number);
        if (pos < 0) {
          preSmsList.pop();
        } else {
          preSmsList.splice(pos, 1);
        }
        return [m].concat(preSmsList);
      })
    };
  }

  const handleScroll = () => {
    if (window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight || isLoading || Global.no_more_flag)
      return;

    setPage(prePage => { return prePage + 1 });
  };

  useEffect(() => {
    setIsLoading(true);
    setMoreLabel("Loading...");
    getSMSAbstract(page).then(resp => {
      setIsLoading(false);
      if (resp.data.length < 20) { setMoreLabel("No More"); Global.no_more_flag = true; } else { setMoreLabel("Load More"); }
      setSmsList(smsList.concat(resp.data));
    });
  }, [page]);

  useEffect(() => {
    Global.no_more_flag = false;
    getSMSAbstract(page).then(resp => {
      setSmsList(resp.data);
      location.state && location.state.smsScrollTo && window.scrollTo(0, location.state.smsScrollTo);
    });
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []); // empty array, only run once

  const newSms = () => {
    navigate('/sms_chat', { state: { newSms: true, smsScrollTo: document.documentElement.scrollTop || window.pageYOffset || document.body.scrollTop } })
  };

  return (<div className='container'>
    <div className="navbar bg-base-100 sticky top-0 z-30 flex border-2">
      <nav className='navbar'>
        <h3 className='text-xl'>{t('SMS')}</h3>
      </nav>
      <button className="btn btn-outline flex-1" onClick={newSms}><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M4 20V4h6.615v1H5v14h14v-5.615h1V20H4Zm12-9V8h-3V7h3V4h1v3h3v1h-3v3h-1Z" /></svg></button>
    </div>{/* end of navbar */}

    <div className='content-box'>
      {/* <ul> */}
      <table className=''><tbody>
        {smsList.map((sms: SMSMessage) => (
          <tr key={sms.id}>
            <td><SMSItem sms={sms} /></td>
            <td><DelSMS className='flex-1' number={sms.number} sms={{ smsList: smsList, set: setSmsList }} /></td>
          </tr>
        ))}
      </tbody></table>
      {/* </ul> */}
    </div>

    <Footer />
  </div>
  );
}

export default SMSPage;
