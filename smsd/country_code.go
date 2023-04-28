package smsd

import (
	"strings"
)

// https://zh.wikipedia.org/zh-sg/%E5%9B%BD%E9%99%85%E7%94%B5%E8%AF%9D%E5%8C%BA%E5%8F%B7%E5%88%97%E8%A1%A8

func trimCountryCode(number string) string {
	if len(number) < 3 {
		return number
	}
	code := number[:4]
	if code[:3] == "+86" {
		return number[3:]
	} else if code[:2] == "+1" {
		return number[1:]
	}
	return number
}

func trimPlus(number string) string {
	if len(number) < 3 {
		return number
	}
	if number[0] == '+' {
		return number[1:]
	}
	return number

}

func AddCountryCode(number string) string {
	if number[0] != '+' {
		number = GSM_StateMachine.country + number
	}
	return number
}

func parseCountry(c string) string {
	if strings.Contains(c, "China") {
		return "+86"
	} else if strings.Contains(c, "AT&T") || strings.Contains(c, "T-Mobile") || strings.Contains(c, "Sprint") || strings.Contains(c, "Verizon") || strings.Contains(c, "metroPCS") {
		return "+1"
	}
	return "+0"
}
