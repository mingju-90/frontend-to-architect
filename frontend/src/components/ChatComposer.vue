<script setup>
import { ref } from 'vue'
import { Promotion } from '@element-plus/icons-vue'

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['submit'])
const draft = ref('')

/**
 * 提交当前输入内容。
 * @returns {void}
 */
function submit() {
  const message = draft.value.trim()

  if (!message || props.disabled) {
    return
  }

  emit('submit', message)
  draft.value = ''
}

/**
 * 处理输入框快捷键。
 * @param {KeyboardEvent} event
 * @returns {void}
 */
function handleKeydown(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    submit()
  }
}
</script>

<template>
  <!-- 对话输入区 -->
  <div class="composer">
    <el-input
      v-model="draft"
      type="textarea"
      :rows="3"
      resize="none"
      placeholder="输入问题，Enter 发送，Shift + Enter 换行"
      @keydown="handleKeydown"
    />

    <!-- 发送操作 -->
    <div class="composer__actions">
      <el-button type="primary" :loading="disabled" @click="submit">
        <el-icon><Promotion /></el-icon>
        发送
      </el-button>
    </div>
  </div>
</template>
