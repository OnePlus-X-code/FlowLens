import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { colors, spacing, fontSize, fontWeight } from '@/theme/tokens';
import {
  Button,
  Card,
  FocusSession,
  Modal,
  NoteEditor,
  ResponsiveLayout,
  MobileScheduleView,
  DesktopScheduleView,
} from '@/components';
import { useFocusStore, useTaskStore } from '@/stores';

export default function TodayScreen() {
  const { bp, width } = useBreakpoint();
  const [modalVisible, setModalVisible] = useState(false);

  // ── 全局持久化状态 ───────────────
  const note = useTaskStore((s) => s.note);
  const tasks = useTaskStore((s) => s.tasks);
  const lastGeneratedAt = useTaskStore((s) => s.lastGeneratedAt);
  const hasHydrated = useTaskStore((s) => s._hasHydrated);

  const setNote = useTaskStore((s) => s.setNote);
  const generateTasksFromNote = useTaskStore((s) => s.generateTasksFromNote);
  const toggleTask = useTaskStore((s) => s.toggleTask);
  const clearTasks = useTaskStore((s) => s.clearTasks);
  const currentTaskId = useFocusStore((s) => s.currentTaskId);
  const focusStartedAt = useFocusStore((s) => s.startedAt);
  const startFocus = useFocusStore((s) => s.startFocus);
  const endFocus = useFocusStore((s) => s.endFocus);

  const timestamp = useMemo(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `今日 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }, []);

  const lastGenLabel = useMemo(() => {
    if (!lastGeneratedAt) return null;
    const d = new Date(lastGeneratedAt);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `上次生成：${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }, [lastGeneratedAt]);

  const handleGenerate = () => {
    const blocks = generateTasksFromNote();
    if (blocks.length === 0) setModalVisible(true);
  };

  const handleNoteChange = (patch: { title: string; body: string }) => {
    if (!hasHydrated) return;
    setNote(patch);
  };

  // 根据断点选择日程视图
  const isDesktop = width >= 768;
  const currentTask = tasks.find((task) => task.id === currentTaskId) ?? null;

  const handleStartFocus = (taskId: string) => {
    startFocus(taskId);
    requestDesktopFullscreen(isDesktop);
  };

  const handleCompleteFocus = () => {
    if (currentTask && !currentTask.done) toggleTask(currentTask.id);
    endFocus();
    void exitDesktopFullscreen();
  };

  const handleExitFocus = () => {
    endFocus();
    void exitDesktopFullscreen();
  };

  if (currentTask && focusStartedAt) {
    return (
      <FocusSession
        task={currentTask}
        startedAt={focusStartedAt}
        onComplete={handleCompleteFocus}
        onExit={handleExitFocus}
      />
    );
  }

  const scheduleView = tasks.length > 0 ? (
    isDesktop ? (
      <DesktopScheduleView
        tasks={tasks}
        onToggle={toggleTask}
        onPress={handleStartFocus}
      />
    ) : (
      <MobileScheduleView
        tasks={tasks}
        onToggle={toggleTask}
        onPress={handleStartFocus}
      />
    )
  ) : null;

  const primary = (
    <View style={styles.stack}>
      <Text style={styles.pageTitle}>今日</Text>
      <Text style={styles.pageSubtitle}>
        像写备忘录一样把想法写下来，再一键把它们转成时间块任务。内容会自动保存到本地与云端。
      </Text>

      {/* key 确保 rehydrate 后 NoteEditor 用最新持久化值重新挂载 */}
      <NoteEditor
        key={hasHydrated ? 'hydrated' : 'loading'}
        initialTitle={note.title}
        initialBody={note.body}
        timestamp={timestamp}
        onChange={handleNoteChange}
        titlePlaceholder="标题（例如：周会前的思考）"
        bodyPlaceholder={
          '示例：\n上午\n- 读论文\n中午\n- 洗衣服\n下午\n- 撰写周报\n晚上\n- 打球\n- 写代码\n- 复盘'
        }
      />

      <View style={styles.actions}>
        <Button title="生成任务块" onPress={handleGenerate} />
        <Button title="预览备忘录 JSON" variant="secondary" onPress={() => setModalVisible(true)} />
        {tasks.length > 0 && (
          <Button title="清空任务" variant="ghost" onPress={clearTasks} />
        )}
      </View>

      {scheduleView && (
        <View style={styles.taskSection}>
          <View style={styles.taskHeader}>
            <Text style={styles.taskHeaderTitle}>
              {isDesktop ? '今日看板' : '今日任务块'}
            </Text>
            <View style={styles.taskHeaderRight}>
              {lastGenLabel && <Text style={styles.taskHeaderMeta}>{lastGenLabel}</Text>}
              <Text style={styles.taskHeaderCount}>
                {tasks.filter((t) => t.done).length} / {tasks.length}
              </Text>
            </View>
          </View>
          {scheduleView}
        </View>
      )}
    </View>
  );

  const secondary = (
    <Card title="解析规则" subtitle={`断点 ${bp} ｜ 宽度 ${Math.round(width)}px`}>
      <Text style={styles.body}>备忘录内容将按行解析：</Text>
      <View style={styles.ruleList}>
        <RuleItem accent="#6EE7B7" text="精确：9:00 / 14:30 / 下午2点" />
        <RuleItem accent="#FDE68A" text="早上 / 上午 / 一早" />
        <RuleItem accent="#FCA5A5" text="中午 / 午间" />
        <RuleItem accent="#93C5FD" text="下午 / 午后" />
        <RuleItem accent="#C4B5FD" text="晚上 / 傍晚 / 今晚" />
        <RuleItem accent="#E5E7EB" text="其他 → 归入「随时」" />
      </View>
      <View style={{ height: spacing.md }} />
      <Text style={styles.tip}>
        💾 持久化：{hasHydrated ? '已加载' : '加载中…'} ｜ 📱 {isDesktop ? '桌面看板' : '手机列表'}
      </Text>
    </Card>
  );

  return (
    <>
      <ResponsiveLayout primary={primary} secondary={secondary} />
      <Modal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title="当前备忘录内容"
      >
        <Text style={styles.body}>
          {JSON.stringify({ note, taskCount: tasks.length, lastGeneratedAt }, null, 2)}
        </Text>
        <View style={styles.modalActions}>
          <Button title="关闭" onPress={() => setModalVisible(false)} />
        </View>
      </Modal>
    </>
  );
}

function RuleItem({ accent, text }: { accent: string; text: string }) {
  return (
    <View style={styles.ruleRow}>
      <View style={[styles.ruleDot, { backgroundColor: accent }]} />
      <Text style={styles.ruleText}>{text}</Text>
    </View>
  );
}

function requestDesktopFullscreen(isDesktop: boolean) {
  if (!isDesktop || typeof document === 'undefined') return;
  const element = document.documentElement;
  if (!document.fullscreenElement && element.requestFullscreen) {
    void element.requestFullscreen().catch(() => undefined);
  }
}

async function exitDesktopFullscreen() {
  if (typeof document === 'undefined') return;
  if (document.fullscreenElement && document.exitFullscreen) {
    await document.exitFullscreen().catch(() => undefined);
  }
}

const styles = StyleSheet.create({
  stack: { gap: spacing.md },
  pageTitle: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  pageSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  body: { fontSize: fontSize.md, color: colors.textSecondary, lineHeight: 22 },
  tip: { fontSize: fontSize.xs, color: colors.textMuted },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    flexWrap: 'wrap',
  },
  taskSection: { marginTop: spacing.md },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  taskHeaderTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  taskHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  taskHeaderMeta: { fontSize: fontSize.xs, color: colors.textMuted },
  taskHeaderCount: { fontSize: fontSize.sm, color: colors.textMuted },
  ruleList: { marginTop: spacing.sm, gap: spacing.xs },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 4,
  },
  ruleDot: { width: 10, height: 10, borderRadius: 5 },
  ruleText: { fontSize: fontSize.sm, color: colors.textSecondary },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
});
