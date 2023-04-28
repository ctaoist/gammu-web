import { useEffect, useState, Fragment } from "react";
import i18next from "i18next";
import { useTranslation } from "react-i18next";
import useSWR, { SWRConfig, useSWRConfig } from "swr";
import { useNavigate } from "react-router-dom";

import { routers, getRouterLinkByLabel, getRouterLabelByLink } from "../pages/_routers";
import { SMSMessage, getPhoneInfo, getSMSListByNumber } from '../services/sms';
import { parseTime } from '../services/utils';

import { Box, Paper, ListItem, Divider, ListItemText, ListItemButton, Typography, Container, TableContainer, TableCell, Stack } from '@mui/material';
import { styled } from '@mui/material/styles';

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));


export const SMSItem = (props: any) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const itemClicked = () => {
    // getSMSListByNumber(0, props.sms.number).then(resp => {
    //   if (resp.retCode !== 0) {}
    // });
    navigate("/sms_chat", { state: { number: props.sms.number, smsScrollTo: document.documentElement.scrollTop || window.pageYOffset || document.body.scrollTop } })
  };

  return (
    <ListItem alignItems="flex-start" sx={{ width: '100%' }}>
      <ListItemButton onClick={itemClicked}>
        {/* {props.sms.text.split('\n').map((e: string, i: number) => (
          <Typography key={i} component='p' variant='body1' style={{ color: "grey" }}>{e}</Typography>
        ))} */}
        <ListItemText
          primary={props.sms.number}
          secondary={<Fragment>
            {props.sms.text.split('\n').map((e: string, i: number) => (
              <Typography key={i} component='p' variant='body1' style={{ color: "grey" }}>{e}</Typography>
            ))}
            <Typography variant="body2" sx={{ float: 'right' }} style={{ color: "grey" }}>{parseTime(props.sms.time)}</Typography>
          </Fragment>
          }
        />
      </ListItemButton>
    </ListItem>
  )
}