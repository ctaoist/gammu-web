interface PhoneInfo {
  ownNumber?: string
  loadFlag: boolean
}

export module Global {
  export let phoneInfo: PhoneInfo;
  export let token: string;
  export let no_more_flag: boolean;
}