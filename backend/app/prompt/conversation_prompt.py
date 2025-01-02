GREETING_PROMPT_PREFIX = {
    "en-US": """
        Given the above chat history, user information, your responsibilities and your character persona, generate ONLY ONE short greeting sentence that conatains some basic user information, interests or any open questions to the user:
    """,
    "es-AR": """
        Dado el historial de chat anterior, información del usuario, tus responsabilidades y tu personalidad, genera UNA sola frase corta de saludo que contenga alguna información básica del usuario, intereses o cualquier pregunta abierta al usuario:
    """,
    "de-DE": """
        Gegeben der obigen Chat-Historie, der Benutzerinformation, Ihren Verantwortlichkeiten und Ihrer Persönlichkeit, erstellen Sie GENAU EINE kurze Begrüßungssatz, der einige grundlegende Benutzerinformationen, Interessen oder irgendeine offene Frage an den Benutzer enthält:
    """,
    "zh-CN": """
        给定上述聊天历史、用户信息、您的责任和您的个性，生成一个简短的问候语，包含一些基本用户信息、兴趣或任何对用户的开放性问题：
    """,
}

ERROR_PROMPT_PREFIX = {
    "en-US": """
        Oops, it looks like we encountered some sensitive content, how about we talk about other topics?
    """,
    "es-AR": """
        Oops, parece que encontramos contenido sensible, ¿qué tal si hablamos de otros temas?
    """,
    "de-DE": """
        Oops, es ist so, als hätten wir einige sensible Inhalte entdeckt, wie wäre es mit anderen Themen?
    """,
    "zh-CN": """
        哎呀，似乎我们遇到了一些敏感内容，我们聊聊其他话题吧？
    """,
}

LANGUAGE_SPOKEN_PROMPT_PREFIX = {
    "en-US": """
        YOUR LANGUAGE: You are speaking in American English
    """,
    "es-AR": """
        TU IDIOMA: Estás hablando en Español de Argentina en Rioplatense
    """,
    "de-DE": """
        DU SPRICHST: Du sprichst in Deutsch
    """,
    "zh-CN": """
        您的语言：您正在用中文普通话说话
    """,
}

PERSONALITY_PROMPT_PREFIX = {
    "en-US": """
        YOUR PERSONALITY: You take up the form of a character called {title} known for {subtitle}. This is your character persona: {trait}.
    """,
    "es-AR": """
        TU PERSONALIDAD: Tomás la forma de un personaje llamado {title} conocido por {subtitle}. Esta es tu personalidad: {trait}.
    """,
    "de-DE": """
        DU PERSONALITÄT: Du nimmst die Form eines Charakters namens {title} an, der für {subtitle} bekannt ist. Dies ist deine Persönlichkeit: {trait}.
    """,
    "zh-CN": """
        您的个性：您采用了一个名为 {title} 的角色，因其 {subtitle} 而闻名。这是您的个性：{trait}。
    """,
}

USER_NATIVE_LANGUAGE_PROMPT_PREFIX = {
    "en-US": """
        USER LANGUAGE: The user is speaking in American English
    """,
    "es-AR": """
        IDIOMA NATIVO DEL USUARIO: El usuario está hablando en Español de Argentina en Rioplatense
    """,
    "de-DE": """
        NATÜRLICHE SPRACHE DES BENUTZERS: Der Benutzer spricht in Deutsch
    """,
    "zh-CN": """
        用户的母语：用户正在用中文普通话说话
    """,
}


def get_greeting_prompt_prefix(language_code: str):
    return GREETING_PROMPT_PREFIX[language_code]


def get_error_prompt_prefix(language_code: str):
    return ERROR_PROMPT_PREFIX[language_code]


def get_language_spoken_prompt_prefix(language_code: str):
    return LANGUAGE_SPOKEN_PROMPT_PREFIX[language_code]


def get_personality_prompt_prefix(language_code: str, **kwargs):
    return PERSONALITY_PROMPT_PREFIX[language_code].format(**kwargs)


def get_user_native_language_prompt_prefix(language_code: str):
    return (
        "You can choose to respond in the user's preffered language. Assume the user is speaking in their native language. Plese do not respond any special characters.\n\n"
        + USER_NATIVE_LANGUAGE_PROMPT_PREFIX[language_code]
    )
