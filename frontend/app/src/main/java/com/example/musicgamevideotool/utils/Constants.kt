package com.example.musicgamevideotool.utils

object Constants {
    // ⚠️ 替换为你的 CloudBase 环境ID
    const val ENV_ID = " music-game-video-tool-9a4dacc3e9 "

    // API 基础地址
    const val BASE_URL = "https://${ENV_ID}.service.tcloudbase.com/music-api/"

    // 本地存储 Key
    const val PREF_NAME = "music_game_prefs"
    const val KEY_AUTH_TOKEN = "auth_token"
}