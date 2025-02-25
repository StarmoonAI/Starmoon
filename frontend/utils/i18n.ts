export type EnglishCopy =
        | "Playground"
        | "Trends"
        | "Settings"
        | "Play"
        | "Characters"
        | "Sent"
        | "Chat"
        | "Send to device"
        | "Upgrade"
        | "No characters found"
        | "Doctor's AI Assistants"
        | "credits remaining"
        | "Get unlimited access"
        | "Upgrade to continue"
        | "You can update your settings here"
        | "Track your patients' progress and trends here"
        | "Use this playground or your device to engage your patients";

export const tx = (languageCode: LanguageCodeType) => {
        return (key: EnglishCopy) => {
                return {
                        "en-US": {
                                Playground: "Playground",
                                Upgrade: "Upgrade",
                                Trends: "Trends",
                                Settings: "Settings",
                                Play: "Play",
                                Characters: "Characters",
                                Sent: "Sent",
                                Chat: "Chat",
                                "Send to device": "Send to device",
                                "No characters found": "No characters found",
                                "Doctor's AI Assistants":
                                        "Doctor's AI Assistants",
                                "credits remaining": "credits remaining",
                                "Get unlimited access": "Get unlimited access",
                                "Upgrade to continue": "Upgrade to continue",
                                "You can update your settings here":
                                        "You can update your settings here",
                                "Track your patients' progress and trends here":
                                        "Track your patients' progress and trends here",
                                "Use this playground or your device to engage your patients":
                                        "Use this playground or your device to engage your patients",
                        },
                        "de-DE": {
                                Playground: "Spielplatz",
                                Upgrade: "Upgrade",
                                Trends: "Trends",
                                Settings: "Einstellungen",
                                Play: "Spielen",
                                Characters: "Charaktere",
                                Sent: "Gesendet",
                                Chat: "Chat",
                                "Send to device": "An Gerät senden",
                                "No characters found":
                                        "Keine Charaktere gefunden",
                                "Doctor's AI Assistants": "Arzt-AI-Assistenzen",
                                "credits remaining": "Kredite verbleibend",
                                "Get unlimited access":
                                        "Unbegrenzten Zugang erhalten",
                                "Upgrade to continue":
                                        "Upgrade um fortzufahren",
                                "You can update your settings here":
                                        "Hier können Sie Ihre Einstellungen aktualisieren",
                                "Track your patients' progress and trends here":
                                        "Hier können Sie die Fortschitte Ihrer Patienten verfolgen",
                                "Use this playground or your device to engage your patients":
                                        "Verwenden Sie dieses Spielplatz oder Ihr Gerät um Ihre Patienten zu engagieren",
                        },
                        "es-ES": {
                                Playground: "Zona de juegos",
                                Upgrade: "Actualizar",
                                Trends: "Tendencias",
                                Settings: "Configuración",
                                Play: "Jugar",
                                Characters: "Personajes",
                                Sent: "Enviado",
                                Chat: "Chat",
                                "Send to device": "Enviar al dispositivo",
                                "No characters found":
                                        "No se encontraron personajes",
                                "Doctor's AI Assistants": "Arzt-AI-Assistenzen",
                                "credits remaining": "Créditos restantes",
                                "Get unlimited access":
                                        "Obtener acceso ilimitado",
                                "Upgrade to continue":
                                        "Actualizar para continuar",
                                "You can update your settings here":
                                        "Aquí puede actualizar sus configuraciones",
                                "Track your patients' progress and trends here":
                                        "Aquí puede seguir el progreso y las tendencias de sus pacientes",
                                "Use this playground or your device to engage your patients":
                                        "Use este playground o tu dispositivo para involucrar a tus pacientes",
                        },
                        "es-AR": {
                                Playground: "Zona de juegos",
                                Upgrade: "Actualizar",
                                Trends: "Tendencias",
                                Settings: "Configuración",
                                Play: "Jugar",
                                Characters: "Personajes",
                                Sent: "Enviado",
                                Chat: "Chat",
                                "Send to device": "Mandar al dispositivo",
                                "No characters found":
                                        "No se encontraron personajes",
                                "Doctor's AI Assistants": "Arzt-AI-Assistenzen",
                                "credits remaining": "Créditos restantes",
                                "Get unlimited access":
                                        "Obtener acceso ilimitado",
                                "Upgrade to continue":
                                        "Actualizar para continuar",
                                "You can update your settings here":
                                        "Aquí puede actualizar sus configuraciones",
                                "Track your patients' progress and trends here":
                                        "Aquí puede seguir el progreso y las tendencias de sus pacientes",
                                "Use this playground or your device to engage your patients":
                                        "Use este playground o tu dispositivo para involucrar a tus pacientes",
                        },
                        "zh-CN": {
                                Playground: "游乐场",
                                Upgrade: "升级",
                                Trends: "趋势",
                                Settings: "设置",
                                Play: "开始对话",
                                Characters: "角色",
                                Sent: "发送",
                                Chat: "聊天",
                                "Send to device": "发送至设备",
                                "No characters found": "未找到角色",
                                "Doctor's AI Assistants": "医生AI助手",
                                "credits remaining": "剩余积分",
                                "Get unlimited access": "获取无限访问",
                                "Upgrade to continue": "升级以继续",
                                "You can update your settings here":
                                        "您可以在此处更新您的设置",
                                "Track your patients' progress and trends here":
                                        "您可以在此处跟踪您的患者的进展和趋势",
                                "Use this playground or your device to engage your patients":
                                        "使用此游乐场或您的设备与您的患者互动",
                        },
                }[languageCode][key];
        };
};
