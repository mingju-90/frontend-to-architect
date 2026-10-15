<script setup>
import { computed, ref } from 'vue'
import { Menu, Monitor, Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import ChatComposer from './components/ChatComposer.vue'
import ChatMessage from './components/ChatMessage.vue'
import ConversationList from './components/ConversationList.vue'
import { requestChat } from './api/chat.js'

/**
 * 创建一条新会话。
 * @returns {{ id: string, title: string, messages: Array }}
 */
function createConversationRecord() {
  return {
    id: crypto.randomUUID(),
    title: '新对话',
    messages: [],
  }
}

const firstConversation = createConversationRecord()
const conversations = ref([firstConversation])
const activeId = ref(firstConversation.id)
const sending = ref(false)
const mobileConversationVisible = ref(false)
const connectionText = ref('等待请求')
const connectionType = ref('info')
const activeConversation = computed(
  () => conversations.value.find((conversation) => conversation.id === activeId.value),
)

/**
 * 新建会话并切换为当前会话。
 * @returns {void}
 */
function createConversation() {
  const conversation = createConversationRecord()
  conversations.value.unshift(conversation)
  activeId.value = conversation.id
}

/**
 * 切换当前会话并关闭移动端会话抽屉。
 * @param {string} conversationId
 * @returns {void}
 */
function selectConversation(conversationId) {
  activeId.value = conversationId
  mobileConversationVisible.value = false
}

/**
 * 发送用户消息并追加助手回复。
 * @param {string} content
 * @returns {Promise<void>}
 */
async function sendMessage(content) {
  const conversation = activeConversation.value

  if (!conversation || sending.value) {
    return
  }

  conversation.title = content.slice(0, 18)
  conversation.messages.push({
    id: crypto.randomUUID(),
    role: 'user',
    content,
  })
  sending.value = true

  try {
    const result = await requestChat({
      message: content,
      conversationId: conversation.id,
    })

    conversation.messages.push({
      id: crypto.randomUUID(),
      role: 'assistant',
      content: result.reply,
    })
    connectionText.value = '服务已连接'
    connectionType.value = 'success'
  } catch (error) {
    console.error(error)
    connectionText.value = '连接异常'
    connectionType.value = 'danger'
    ElMessage.error(error instanceof Error ? error.message : '发送失败')
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <el-container class="app-shell">
    <!-- 顶部栏 -->
    <el-header class="app-header">
      <div class="app-header__brand">
        <el-icon><Monitor /></el-icon>
        <div>
          <strong>AI 对话工作台</strong>
          <span>Vue 3 + Element Plus</span>
        </div>
      </div>

      <!-- 状态和操作 -->
      <div class="app-header__actions">
        <el-tag :type="connectionType" effect="plain">{{ connectionText }}</el-tag>
        <el-button class="mobile-menu-button" circle @click="mobileConversationVisible = true">
          <el-icon><Menu /></el-icon>
        </el-button>
        <el-button type="primary" @click="createConversation">
          <el-icon><Plus /></el-icon>
          新建对话
        </el-button>
      </div>
    </el-header>

    <el-container class="app-body">
      <!-- 桌面端会话列表 -->
      <el-aside class="conversation-aside" width="264px">
        <ConversationList
          :conversations="conversations"
          :active-id="activeId"
          @create="createConversation"
          @select="selectConversation"
        />
      </el-aside>

      <!-- 对话主区域 -->
      <el-main class="chat-main">
        <div class="chat-panel">
          <div class="message-list">
            <el-empty
              v-if="!activeConversation?.messages?.length"
              description="输入问题开始对话"
            />

            <!-- 当前会话消息 -->
            <ChatMessage
              v-for="message in activeConversation?.messages ?? []"
              :key="message.id"
              :message="message"
            />
          </div>

          <ChatComposer :disabled="sending" @submit="sendMessage" />
        </div>
      </el-main>
    </el-container>

    <!-- 移动端会话抽屉 -->
    <el-drawer
      v-model="mobileConversationVisible"
      direction="ltr"
      size="82%"
      :with-header="false"
    >
      <ConversationList
        :conversations="conversations"
        :active-id="activeId"
        @create="createConversation"
        @select="selectConversation"
      />
    </el-drawer>
  </el-container>
</template>
