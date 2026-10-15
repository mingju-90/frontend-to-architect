<script setup>
defineProps({
  message: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <!-- 单条用户或助手消息 -->
  <article class="message" :class="`message--${message.role}`">
    <div class="message__avatar">
      {{ message.role === 'user' ? '我' : 'AI' }}
    </div>
    <div class="message__body">
      <p>{{ message.content }}</p>
    </div>
  </article>
</template>
