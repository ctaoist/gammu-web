import { useEffect, useState, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import i18next from "i18next";
import { useTranslation } from "react-i18next";

import { SMSMessage, delSMS } from "../services/sms";

import { AppBar, Toolbar, Box, Button, CssBaseline, IconButton, List, ListItem, FormGroup, Stack, Container, TextField, Typography, TableBody, Table, TableRow, Paper } from '@mui/material';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';

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
    <Button onClick={delSms}><DeleteTwoToneIcon /></Button>
  )
}