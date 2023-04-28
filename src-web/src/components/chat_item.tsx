import { useEffect, useState, Fragment } from "react";
import i18next from "i18next";
import { useTranslation } from "react-i18next";
import useSWR, { SWRConfig, useSWRConfig } from "swr";
import { useNavigate } from "react-router-dom";

import { parseTime } from '../services/utils';

import { Box, Button, List, ListItem, Divider, ListItemText, Typography, Container, TableContainer, TableCell, TableBody, Table, TableRow, Paper } from '@mui/material';

export const ChatItem = (props: any) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const bgcolor = props.sms.sent ? '#6fbf73' : '#e0e0e0';
  const textcolor = props.sms.sent ? 'white' : 'black';
  const timeColor = props.sms.sent ? "#e0e0e0" : 'black';
  const flex = props.sms.sent ? "right" : 'left';

  return (
    <ListItem sx={{ width: '60%', backgroundColor: bgcolor, float: flex, mb: 2 }}>
      <ListItemText
        primary={<Fragment>{props.sms.text.split('\n').map((e: string, i: number) => (
          <Typography key={i} style={{ color: textcolor }}>{e}</Typography>
        ))}
        </Fragment>}
        secondary={
          <Typography
            sx={{ display: 'inline' }}
            style={{ color: timeColor }}
            component="span"
            variant="body2"
          >
            {parseTime(props.sms.time)}
          </Typography>
        } />
    </ListItem>
  )
}

export default ChatItem;