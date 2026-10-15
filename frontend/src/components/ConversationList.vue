<script setup>
import { Plus } from '@element-plus/icons-vue'

defineProps({
  conversations: {
    type: Array,
    required: true,
  },
  activeId: {
    type: String,
    required: true,
  },
})

defineEmits(['create', 'select'])
</script>

<template>
  <!-- 会话列表头部 -->
  <div class="conversation-list">
    <el-button class="conversation-list__create" type="primary" @click="$emit('create')">
      <el-icon><Plus /></el-icon>
      新建对话
    </el-button>

    <!-- 会话列表 -->
    <el-scrollbar class="conversation-list__scroll">
      <button
        v-for="conversation in conversations"
        :key="conversation.id"
        class="conversation-list__item"
        :class="{ 'is-active': conversation.id === activeId }"
        type="button"
        @click="$emit('select', conversation.id)"
      >
        {{ conversation.title }}
      </button>
    </el-scrollbar>
  </div>
</template>
