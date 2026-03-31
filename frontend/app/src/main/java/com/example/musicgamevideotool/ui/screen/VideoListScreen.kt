package com.example.musicgamevideotool.ui.screen

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.example.musicgamevideotool.viewmodel.VideoListViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VideoListScreen(
    viewModel: VideoListViewModel = viewModel()
) {
    val videos by viewModel.videos.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val error by viewModel.error.collectAsState()

    // 首次加载
    LaunchedEffect(Unit) {
        viewModel.loadVideos()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "音游视频练习助手",
                        fontWeight = FontWeight.Bold
                    )
                }
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when {
                isLoading -> {
                    CircularProgressIndicator(
                        modifier = Modifier.align(Alignment.Center)
                    )
                }

                error != null -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Text(text = "❌", fontSize = 48.sp)
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(text = error ?: "加载失败")
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(onClick = { viewModel.refresh() }) {
                            Text("重试")
                        }
                    }
                }

                videos.isEmpty() -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Text(text = "📹", fontSize = 48.sp)
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(text = "暂无视频")
                    }
                }

                else -> {
                    LazyColumn(
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(videos) { video ->
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                elevation = CardDefaults.cardElevation(2.dp)
                            ) {
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(16.dp)
                                ) {
                                    Text(
                                        text = video.title,
                                        fontSize = 18.sp,
                                        fontWeight = FontWeight.Medium
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = video.gameName,
                                        fontSize = 14.sp,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = "上传时间: ${video.uploadTime.take(10)}",
                                        fontSize = 12.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}