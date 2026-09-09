'use client';

import { useMemo, useState } from 'react';
import {
  Bot,
  Check,
  ChevronDown,
  Cpu,
  Gauge,
  Info,
  Route,
  Search,
  ShieldAlert,
  Sparkles,
  Zap,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';

export type ModelCategory = '通用' | '推理' | '多模态' | '高效';
export type ModelStatus = 'available' | 'evaluating' | 'unavailable';

export type ModelCatalogItem = {
  id: string;
  name: string;
  maker: string;
  initials: string;
  description: string;
  categories: ModelCategory[];
  scale: string;
  status: ModelStatus;
  recommendedLevels: Array<'L1' | 'L2' | 'L3'>;
};

export type ModelMode = { type: 'smart' } | { type: 'fixed'; modelId: string };

export type RoutingLevel = 'L1' | 'L2' | 'L3';

export type RoutingConfig = Record<
  RoutingLevel,
  {
    primaryModelId: string;
    fallbackModelId: string;
    autoUpgrade: boolean;
  }
>;

export const modelCatalog: ModelCatalogItem[] = [
  {
    id: 'qwen-3-8-2t',
    name: 'Qwen3.8-2.4T-A95B',
    maker: '通义千问',
    initials: 'Q',
    description: '超大规模通用与复杂任务推理',
    categories: ['通用', '推理'],
    scale: '旗舰',
    status: 'available',
    recommendedLevels: ['L3'],
  },
  {
    id: 'deepseek-v4-pro',
    name: 'DeepSeek-V4-Pro-0813',
    maker: '深度求索',
    initials: 'D',
    description: '复杂推理、规划与长链路执行',
    categories: ['推理', '通用'],
    scale: '旗舰',
    status: 'available',
    recommendedLevels: ['L3'],
  },
  {
    id: 'glm-5-3',
    name: 'GLM-5.3',
    maker: '智谱',
    initials: 'G',
    description: '通用办公、工具调用与智能体任务',
    categories: ['通用', '推理'],
    scale: '旗舰',
    status: 'available',
    recommendedLevels: ['L3'],
  },
  {
    id: 'kimi-k3',
    name: 'Kimi K3',
    maker: '月之暗面',
    initials: 'K',
    description: '长文本理解、研究与复杂信息整合',
    categories: ['通用', '推理'],
    scale: '旗舰',
    status: 'available',
    recommendedLevels: ['L3'],
  },
  {
    id: 'hunyuan-hy4',
    name: 'Hy4 preview',
    maker: '腾讯混元',
    initials: 'H',
    description: '综合推理与多任务协同预览模型',
    categories: ['通用', '推理'],
    scale: '旗舰',
    status: 'evaluating',
    recommendedLevels: ['L3'],
  },
  {
    id: 'minimax-m2-7',
    name: 'MiniMax-M2.7',
    maker: 'MiniMax',
    initials: 'M',
    description: '低激活参数的高效智能体模型',
    categories: ['高效', '通用'],
    scale: '约10B激活',
    status: 'available',
    recommendedLevels: ['L2', 'L3'],
  },
  {
    id: 'step-3-7-flash',
    name: 'Step-3.7-Flash',
    maker: '阶跃星辰',
    initials: 'S',
    description: '快速推理、工具调用与并发任务',
    categories: ['高效', '推理'],
    scale: '约11B激活',
    status: 'available',
    recommendedLevels: ['L2', 'L3'],
  },
  {
    id: 'mimo-v2-5-pro',
    name: 'MiMo-V2.5-Pro',
    maker: '小米',
    initials: 'Mi',
    description: '复杂推理与智能体执行增强版本',
    categories: ['推理', '通用'],
    scale: '旗舰',
    status: 'available',
    recommendedLevels: ['L3'],
  },
  {
    id: 'ernie-4-5-300b',
    name: 'ERNIE-4.5-300B-A47B',
    maker: '百度飞桨',
    initials: 'E',
    description: '国产开源通用语言旗舰模型',
    categories: ['通用', '推理'],
    scale: '47B激活',
    status: 'available',
    recommendedLevels: ['L3'],
  },
  {
    id: 'qwen-3-8-27b',
    name: 'Qwen3.8-27B',
    maker: '通义千问',
    initials: 'Q',
    description: '质量与吞吐均衡的通用主力模型',
    categories: ['通用', '高效'],
    scale: '27B',
    status: 'available',
    recommendedLevels: ['L2'],
  },
  {
    id: 'deepseek-v4-flash',
    name: 'DeepSeek-V4-Flash-0731',
    maker: '深度求索',
    initials: 'D',
    description: '轻中度推理与批量任务处理',
    categories: ['高效', '推理'],
    scale: '高效',
    status: 'available',
    recommendedLevels: ['L1', 'L2'],
  },
  {
    id: 'glm-5-3-flash',
    name: 'GLM-5.3-Flash',
    maker: '智谱',
    initials: 'G',
    description: '低延迟办公处理与工具调用',
    categories: ['高效', '通用'],
    scale: '高效',
    status: 'available',
    recommendedLevels: ['L1', 'L2'],
  },
  {
    id: 'ernie-4-5-21b',
    name: 'ERNIE-4.5-21B-A3B',
    maker: '百度飞桨',
    initials: 'E',
    description: '小激活参数的分类、摘要与抽取',
    categories: ['高效', '通用'],
    scale: '3B激活',
    status: 'available',
    recommendedLevels: ['L1'],
  },
  {
    id: 'qwen-3-5-9b',
    name: 'Qwen3.5-9B',
    maker: '通义千问',
    initials: 'Q',
    description: '结构化提取、摘要与轻量理解',
    categories: ['高效', '通用'],
    scale: '9B',
    status: 'available',
    recommendedLevels: ['L1'],
  },
  {
    id: 'internlm3-8b',
    name: 'InternLM3-8B-Instruct',
    maker: '书生浦语',
    initials: 'I',
    description: '指令跟随、信息整理与本地部署',
    categories: ['高效', '通用'],
    scale: '8B',
    status: 'available',
    recommendedLevels: ['L1'],
  },
  {
    id: 'glm-4-1v-9b',
    name: 'GLM-4.1V-9B-Thinking',
    maker: '智谱',
    initials: 'G',
    description: '图片、扫描件与页面内容理解',
    categories: ['多模态', '高效'],
    scale: '9B',
    status: 'available',
    recommendedLevels: ['L1', 'L2'],
  },
  {
    id: 'minicpm-v-4-6',
    name: 'MiniCPM-V 4.6',
    maker: '面壁智能',
    initials: 'C',
    description: '端侧视觉理解、OCR与文档识别',
    categories: ['多模态', '高效'],
    scale: '端侧',
    status: 'available',
    recommendedLevels: ['L1'],
  },
  {
    id: 'intern-s1-pro',
    name: 'Intern-S1-Pro',
    maker: '书生浦语',
    initials: 'I',
    description: '科研与专业分析特化模型',
    categories: ['推理', '多模态'],
    scale: '专业',
    status: 'unavailable',
    recommendedLevels: ['L3'],
  },
];

export const defaultRoutingConfig: RoutingConfig = {
  L1: {
    primaryModelId: 'ernie-4-5-21b',
    fallbackModelId: 'glm-5-3-flash',
    autoUpgrade: true,
  },
  L2: {
    primaryModelId: 'qwen-3-8-27b',
    fallbackModelId: 'minimax-m2-7',
    autoUpgrade: true,
  },
  L3: {
    primaryModelId: 'deepseek-v4-pro',
    fallbackModelId: 'qwen-3-8-2t',
    autoUpgrade: true,
  },
};

export function cloneRoutingConfig(config: RoutingConfig): RoutingConfig {
  return {
    L1: { ...config.L1 },
    L2: { ...config.L2 },
    L3: { ...config.L3 },
  };
}

export function modelById(modelId: string) {
  return modelCatalog.find((model) => model.id === modelId);
}

const filters: Array<'全部' | ModelCategory> = [
  '全部',
  '通用',
  '推理',
  '多模态',
  '高效',
];

const statusLabel: Record<ModelStatus, string> = {
  available: '已接入',
  evaluating: '评测中',
  unavailable: '当前不可用',
};

export function ModelSelector({
  value,
  onChange,
  routing,
  onRoutingChange,
  align = 'end',
}: {
  value: ModelMode;
  onChange: (value: ModelMode) => void;
  routing: RoutingConfig;
  onRoutingChange: (value: RoutingConfig) => void;
  align?: 'start' | 'center' | 'end';
}) {
  const [open, setOpen] = useState(false);
  const [routingOpen, setRoutingOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<(typeof filters)[number]>('全部');
  const selectedModel =
    value.type === 'fixed' ? modelById(value.modelId) : undefined;
  const visibleModels = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return modelCatalog.filter((model) => {
      const matchesFilter =
        filter === '全部' || model.categories.includes(filter);
      const matchesQuery =
        !normalizedQuery ||
        `${model.name}${model.maker}${model.description}${model.scale}`
          .toLowerCase()
          .includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [filter, query]);

  const selectMode = (mode: ModelMode) => {
    onChange(mode);
    setOpen(false);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              className="h-8 max-w-[190px] gap-1.5 rounded-lg px-2 text-[length:var(--ui-font-meta)] font-normal text-[color:var(--ui-text)] hover:bg-[var(--ui-canvas)]"
            />
          }
        >
          {value.type === 'smart' ? (
            <Sparkles className="size-3.5 text-[color:var(--ui-brand)]" />
          ) : (
            <Cpu className="size-3.5 text-[color:var(--ui-text)]" />
          )}
          <span className="truncate">
            {value.type === 'smart'
              ? '智能模式'
              : (selectedModel?.name ?? '固定模型')}
          </span>
          <ChevronDown className="size-3 text-[color:var(--ui-muted)]" />
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align={align}
          sideOffset={8}
          className="w-[410px] gap-0 overflow-hidden rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-0 shadow-[var(--ui-shadow)]"
        >
          <div className="border-b border-[var(--ui-border)] p-2.5">
            <button
              type="button"
              onClick={() => selectMode({ type: 'smart' })}
              className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition ${
                value.type === 'smart'
                  ? 'border-[var(--ui-border)] bg-[var(--ui-canvas)]'
                  : 'border-transparent hover:bg-[var(--ui-canvas)]'
              }`}
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-[var(--ui-brand-soft)] text-[color:var(--ui-brand)]">
                <Sparkles className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-[length:var(--ui-font-meta)] font-semibold text-[color:var(--ui-text)]">
                  智能模式
                  <span className="rounded bg-[var(--ui-surface)]/80 px-1.5 py-0.5 text-[length:var(--ui-font-meta)] font-normal text-[color:var(--ui-muted)]">
                    推荐
                  </span>
                </span>
                <span className="mt-0.5 block text-[length:var(--ui-font-meta)] text-[color:var(--ui-muted)]">
                  按任务等级选模，必要时升级或切换备用模型
                </span>
              </span>
              {value.type === 'smart' ? (
                <Check className="size-4 text-[color:var(--ui-brand)]" />
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setRoutingOpen(true);
              }}
              className="mt-1.5 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[length:var(--ui-font-meta)] text-[color:var(--ui-muted)] hover:bg-[var(--ui-canvas)]"
            >
              <Route className="size-3.5" />
              查看本任务四级调度
              <ChevronDown className="ml-auto size-3 -rotate-90" />
            </button>
          </div>

          <div className="border-b border-[var(--ui-border)] p-2.5">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[color:var(--ui-muted)]" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索模型或厂商"
                className="h-8 border-[var(--ui-border)] pl-8 text-[length:var(--ui-font-meta)]"
              />
            </div>
            <div className="mt-2 flex gap-1">
              {filters.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  className={`rounded-md px-2 py-1 text-[length:var(--ui-font-meta)] transition ${
                    filter === item
                      ? 'bg-[var(--ui-brand-soft)] text-[color:var(--ui-brand)]'
                      : 'text-[color:var(--ui-muted)] hover:bg-[var(--ui-canvas)]'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[310px] overflow-y-auto p-1.5">
            {visibleModels.map((model) => {
              const selected =
                value.type === 'fixed' && value.modelId === model.id;
              const disabled = model.status !== 'available';
              return (
                <button
                  key={model.id}
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    selectMode({ type: 'fixed', modelId: model.id })
                  }
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition ${
                    selected
                      ? 'bg-[var(--ui-canvas)]'
                      : 'hover:bg-[var(--ui-canvas)] disabled:cursor-not-allowed disabled:opacity-50'
                  }`}
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[var(--ui-canvas)] text-[length:var(--ui-font-meta)] font-semibold text-[color:var(--ui-text)]">
                    {model.initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-[length:var(--ui-font-meta)] font-medium text-[color:var(--ui-text)]">
                        {model.name}
                      </span>
                      <span className="shrink-0 rounded bg-[var(--ui-canvas)] px-1 py-0.5 text-[length:var(--ui-font-meta)] text-[color:var(--ui-muted)]">
                        {model.scale}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-[length:var(--ui-font-meta)] text-[color:var(--ui-muted)]">
                      {model.maker} · {model.description}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 text-[length:var(--ui-font-meta)] ${
                      model.status === 'available'
                        ? 'text-[color:var(--ui-success)]'
                        : 'text-[color:var(--ui-warning)]'
                    }`}
                  >
                    {statusLabel[model.status]}
                  </span>
                  {selected ? (
                    <Check className="size-3.5 shrink-0 text-[color:var(--ui-brand)]" />
                  ) : null}
                </button>
              );
            })}
          </div>
          <div className="border-t border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-[length:var(--ui-font-meta)] leading-4 text-[color:var(--ui-muted)]">
            仅显示组织允许的模型。固定模型后，生成步骤不会静默切换模型。
          </div>
        </PopoverContent>
      </Popover>

      <RoutingDialog
        open={routingOpen}
        onOpenChange={setRoutingOpen}
        mode={value}
        onModeChange={onChange}
        value={routing}
        onChange={onRoutingChange}
        title="本任务四级调度"
      />
    </>
  );
}

const levelMeta: Record<
  RoutingLevel,
  { name: string; examples: string; tone: string }
> = {
  L1: {
    name: '轻量处理',
    examples: '分类、抽取、格式整理、简短摘要',
    tone: 'bg-[var(--ui-canvas)] text-[color:var(--ui-success)]',
  },
  L2: {
    name: '常规工作',
    examples: '材料理解、起草、对比、表格分析',
    tone: 'bg-[var(--ui-canvas)] text-[color:var(--ui-brand)]',
  },
  L3: {
    name: '复杂任务',
    examples: '深度研究、复杂推理、跨材料综合',
    tone: 'bg-[var(--ui-canvas)] text-[color:var(--ui-muted)]',
  },
};

function levelModels(level: RoutingLevel) {
  return modelCatalog.filter(
    (model) =>
      model.status === 'available' && model.recommendedLevels.includes(level),
  );
}

export function RoutingConfigEditor({
  value,
  onChange,
  disabled = false,
}: {
  value: RoutingConfig;
  onChange: (value: RoutingConfig) => void;
  disabled?: boolean;
}) {
  const updateLevel = (
    level: RoutingLevel,
    patch: Partial<RoutingConfig[RoutingLevel]>,
  ) => {
    onChange({ ...value, [level]: { ...value[level], ...patch } });
  };

  return (
    <div className={disabled ? 'opacity-50' : ''}>
      <div className="mb-2 grid grid-cols-[140px_minmax(0,1fr)_minmax(0,1fr)_80px] gap-2 px-3 text-[length:var(--ui-font-meta)] font-medium text-[color:var(--ui-muted)]">
        <span>任务等级</span>
        <span>主模型</span>
        <span>备用模型</span>
        <span className="text-center">自动升级</span>
      </div>
      <div className="overflow-hidden rounded-xl border border-[var(--ui-border)]">
        <div className="grid grid-cols-[140px_minmax(0,1fr)_minmax(0,1fr)_80px] items-center gap-2 border-b border-[var(--ui-border)] bg-[var(--ui-canvas)] px-3 py-3">
          <div>
            <span className="inline-flex rounded-md bg-[var(--ui-canvas)] px-1.5 py-0.5 text-[length:var(--ui-font-meta)] font-semibold text-[color:var(--ui-muted)]">
              L0
            </span>
            <p className="mt-1 text-[length:var(--ui-font-meta)] font-medium text-[color:var(--ui-text)]">
              无模型处理
            </p>
          </div>
          <p className="col-span-3 text-[length:var(--ui-font-meta)] text-[color:var(--ui-muted)]">
            规则、检索、缓存与结果复用，不调用生成模型
          </p>
        </div>
        {(['L1', 'L2', 'L3'] as RoutingLevel[]).map((level) => {
          const meta = levelMeta[level];
          const models = levelModels(level);
          return (
            <div
              key={level}
              className="grid grid-cols-[140px_minmax(0,1fr)_minmax(0,1fr)_80px] items-center gap-2 border-b border-[var(--ui-border)] px-3 py-3 last:border-b-0"
            >
              <div className="min-w-0">
                <span
                  className={`inline-flex rounded-md px-1.5 py-0.5 text-[length:var(--ui-font-meta)] font-semibold ${meta.tone}`}
                >
                  {level}
                </span>
                <p className="mt-1 text-[length:var(--ui-font-meta)] font-medium text-[color:var(--ui-text)]">
                  {meta.name}
                </p>
                <p className="mt-0.5 truncate text-[length:var(--ui-font-meta)] text-[color:var(--ui-muted)]">
                  {meta.examples}
                </p>
              </div>
              <NativeSelect
                disabled={disabled}
                value={value[level].primaryModelId}
                onChange={(event) =>
                  updateLevel(level, { primaryModelId: event.target.value })
                }
                aria-label={`${level}主模型`}
                className="w-full [&_select]:h-8 [&_select]:border-[var(--ui-border)] [&_select]:bg-[var(--ui-surface)] [&_select]:text-[length:var(--ui-font-meta)]"
              >
                {models.map((model) => (
                  <NativeSelectOption key={model.id} value={model.id}>
                    {model.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <NativeSelect
                disabled={disabled}
                value={value[level].fallbackModelId}
                onChange={(event) =>
                  updateLevel(level, { fallbackModelId: event.target.value })
                }
                aria-label={`${level}备用模型`}
                className="w-full [&_select]:h-8 [&_select]:border-[var(--ui-border)] [&_select]:bg-[var(--ui-surface)] [&_select]:text-[length:var(--ui-font-meta)]"
              >
                {models.map((model) => (
                  <NativeSelectOption key={model.id} value={model.id}>
                    {model.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <div className="flex justify-center">
                <Switch
                  size="sm"
                  disabled={disabled}
                  checked={value[level].autoUpgrade}
                  onCheckedChange={(checked) =>
                    updateLevel(level, { autoUpgrade: checked })
                  }
                  aria-label={`${level}允许自动升级`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function RoutingDialog({
  open,
  onOpenChange,
  mode,
  onModeChange,
  value,
  onChange,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: ModelMode;
  onModeChange: (mode: ModelMode) => void;
  value: RoutingConfig;
  onChange: (value: RoutingConfig) => void;
  title: string;
}) {
  const fixedModel = mode.type === 'fixed' ? modelById(mode.modelId) : null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[760px] max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-2xl bg-[var(--ui-surface)] p-0 shadow-[var(--ui-shadow)] sm:max-w-[760px]">
        <DialogHeader className="border-b border-[var(--ui-border)] px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-[length:var(--ui-font-control)] font-semibold text-[color:var(--ui-text)]">
            <Route className="size-4 text-[color:var(--ui-brand)]" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-[length:var(--ui-font-meta)] leading-4 text-[color:var(--ui-muted)]">
            智能模式按步骤复杂度调度，而不是给整个任务永久贴一个等级。
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[72vh] overflow-y-auto p-5">
          {mode.type === 'fixed' ? (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-canvas)] p-3.5">
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-[color:var(--ui-warning)]" />
              <div className="min-w-0 flex-1">
                <p className="text-[length:var(--ui-font-meta)] font-medium text-[color:var(--ui-warning)]">
                  当前固定使用 {fixedModel?.name ?? '指定模型'}
                </p>
                <p className="mt-1 text-[length:var(--ui-font-meta)] leading-4 text-[color:var(--ui-text)]">
                  L1—L3调度、自动升级和备用模型均未启用。模型失败或质量不足时，任务会暂停并请求你决定。
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => onModeChange({ type: 'smart' })}
                className="h-8 border-[var(--ui-warning)] bg-[var(--ui-surface)] px-3 text-[length:var(--ui-font-meta)] text-[color:var(--ui-warning)] hover:bg-[var(--ui-warning-soft)]"
              >
                切回智能模式
              </Button>
            </div>
          ) : (
            <div className="mb-4 grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-canvas)] p-3">
                <Zap className="size-3.5 text-[color:var(--ui-brand)]" />
                <p className="mt-2 text-[length:var(--ui-font-meta)] font-medium text-[color:var(--ui-text)]">
                  减少无效调用
                </p>
                <p className="mt-1 text-[length:var(--ui-font-meta)] leading-4 text-[color:var(--ui-muted)]">
                  L0规则、检索、缓存先行，压缩重复上下文
                </p>
              </div>
              <div className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-canvas)] p-3">
                <Gauge className="size-3.5 text-[color:var(--ui-brand)]" />
                <p className="mt-2 text-[length:var(--ui-font-meta)] font-medium text-[color:var(--ui-text)]">
                  匹配足够能力
                </p>
                <p className="mt-1 text-[length:var(--ui-font-meta)] leading-4 text-[color:var(--ui-muted)]">
                  轻任务优先高效模型，复杂步骤再升级
                </p>
              </div>
              <div className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-canvas)] p-3">
                <Cpu className="size-3.5 text-[color:var(--ui-brand)]" />
                <p className="mt-2 text-[length:var(--ui-font-meta)] font-medium text-[color:var(--ui-text)]">
                  稳定政务并发
                </p>
                <p className="mt-1 text-[length:var(--ui-font-meta)] leading-4 text-[color:var(--ui-muted)]">
                  高效模型、批处理与备用路由协同
                </p>
              </div>
            </div>
          )}

          <RoutingConfigEditor
            value={value}
            onChange={onChange}
            disabled={mode.type === 'fixed'}
          />

          <div className="mt-4 flex items-start gap-2 rounded-lg bg-[var(--ui-canvas)] px-3 py-2.5 text-[length:var(--ui-font-meta)] leading-4 text-[color:var(--ui-muted)]">
            <Info className="mt-0.5 size-3.5 shrink-0 text-[color:var(--ui-muted)]" />
            <span>
              配置只影响后续步骤。系统仍遵守资料权限、关键动作确认与完整审计；小模型主要降低算力与延迟，Token节省来自减少调用、上下文裁剪和结果复用。
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function DefaultModelSettings({
  mode,
  onModeChange,
  routing,
  onRoutingChange,
}: {
  mode: ModelMode;
  onModeChange: (mode: ModelMode) => void;
  routing: RoutingConfig;
  onRoutingChange: (value: RoutingConfig) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const fixedModel = mode.type === 'fixed' ? modelById(mode.modelId) : null;
  return (
    <>
      <div className="mb-4 flex items-center justify-between rounded-xl border border-[var(--ui-border)] bg-[var(--ui-brand-soft)] p-4">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-[var(--ui-surface)] text-[color:var(--ui-brand)] shadow-sm">
            {mode.type === 'smart' ? (
              <Sparkles className="size-4" />
            ) : (
              <Bot className="size-4" />
            )}
          </span>
          <div>
            <p className="text-[length:var(--ui-font-meta)] font-semibold text-[color:var(--ui-text)]">
              {mode.type === 'smart'
                ? '默认使用智能模式'
                : `默认固定 ${fixedModel?.name ?? '指定模型'}`}
            </p>
            <p className="mt-1 text-[length:var(--ui-font-meta)] text-[color:var(--ui-muted)]">
              仅用于之后新建的任务，每个任务仍可在输入框单独调整
            </p>
          </div>
        </div>
        <ModelSelector
          value={mode}
          onChange={onModeChange}
          routing={routing}
          onRoutingChange={onRoutingChange}
          align="end"
        />
      </div>
      {mode.type === 'fixed' ? (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-canvas)] px-3 py-2.5 text-[length:var(--ui-font-meta)] text-[color:var(--ui-text)]">
          <ShieldAlert className="size-3.5" />
          固定模型时四级调度不生效；失败或质量不足将暂停并询问，不会静默切换。
        </div>
      ) : null}
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[length:var(--ui-font-meta)] font-semibold uppercase tracking-[0.08em] text-[color:var(--ui-muted)]">
          新任务默认四级调度
        </p>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="text-[length:var(--ui-font-meta)] text-[color:var(--ui-brand)] hover:text-[color:var(--ui-brand)]"
        >
          展开说明
        </button>
      </div>
      <RoutingConfigEditor
        value={routing}
        onChange={onRoutingChange}
        disabled={mode.type === 'fixed'}
      />
      <RoutingDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        mode={mode}
        onModeChange={onModeChange}
        value={routing}
        onChange={onRoutingChange}
        title="新任务默认四级调度"
      />
    </>
  );
}
