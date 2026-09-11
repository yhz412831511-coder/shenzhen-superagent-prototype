'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Bot,
  Check,
  ChevronRight,
  Network,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useWorkspace } from './workspace-store';
import { agentDetailProfiles } from './fiscal-catalog';
import {
  carriersForUnit,
  organizationCarriers,
  organizationRegistryMeta,
  organizationUnits,
  preferredCarrierForUnit,
  sceneAgents,
  searchOrganization,
  unitForCarrier,
} from './professional-intelligence-domain';
import './professional-intelligence.css';

type View = 'organization' | 'scene';
type MobileStep = 'index' | 'list' | 'detail';

export function ProfessionalIntelligencePage({
  onConsult,
  onUse,
  initialView = 'organization',
  initialId = '',
}: {
  onConsult: (id: string, text: string) => void;
  onUse: (id: string) => void;
  initialView?: View;
  initialId?: string;
}) {
  const { state, dispatch } = useWorkspace();
  const initialUnit = unitForCarrier(initialId);
  const initialScene = state.catalog.find((item) => item.id === initialId);
  const [view, setView] = useState<View>(initialView);
  const [query, setQuery] = useState('');
  const [unitId, setUnitId] = useState(initialUnit?.id || 'zsj');
  const [carrierId, setCarrierId] = useState(
    initialView === 'organization' && initialId
      ? initialId
      : 'project-coordination-digital-person',
  );
  const [sceneId, setSceneId] = useState(
    initialView === 'scene' && initialId ? initialId : 'government-disclosure',
  );
  const [mobileStep, setMobileStep] = useState<MobileStep>(
    initialId ? 'detail' : 'index',
  );
  const [pendingSceneId, setPendingSceneId] = useState('');
  const dialogClose = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (pendingSceneId) dialogClose.current?.focus();
  }, [pendingSceneId]);

  const visibleUnitIds = useMemo(() => searchOrganization(query), [query]);
  const units = organizationUnits.filter((unit) =>
    visibleUnitIds.includes(unit.id),
  );
  const unit = organizationUnits.find((item) => item.id === unitId);
  const carriers = carriersForUnit(unitId);
  const carrier = organizationCarriers.find((item) => item.id === carrierId);
  const scenes = sceneAgents(state.catalog);
  const scene = scenes.find((item) => item.id === sceneId) || scenes[0];
  const sceneProfile = agentDetailProfiles.profiles.find(
    (item) => item.id === scene?.id,
  );
  const sceneCategories = [...new Set(scenes.map((item) => item.category))];
  const [sceneCategory, setSceneCategory] = useState(
    initialView === 'scene' && initialScene
      ? initialScene.category
      : sceneCategories[0] || '',
  );
  const visibleScenes = scenes.filter(
    (item) => !sceneCategory || item.category === sceneCategory,
  );

  const updateSearch = (value: string) => {
    setQuery(value);
    const matchedUnitIds = searchOrganization(value);
    if (!value.trim() || !matchedUnitIds.length) return;
    const nextUnitId = matchedUnitIds[0];
    const nextCarrier = preferredCarrierForUnit(nextUnitId, value);
    setUnitId(nextUnitId);
    setCarrierId(
      nextCarrier?.buildStatus === 'built' ? nextCarrier.id : '',
    );
  };

  const chooseUnit = (id: string) => {
    setUnitId(id);
    setCarrierId(preferredCarrierForUnit(id)?.id || '');
    setMobileStep('list');
  };

  const chooseCarrier = (id: string) => {
    setCarrierId(id);
    setMobileStep('detail');
  };

  const switchView = (next: View) => {
    setView(next);
    setQuery('');
    setMobileStep('index');
  };

  const startScene = () => {
    if (!scene) return;
    setPendingSceneId(scene.id);
  };

  return (
    <section className="pi-page" aria-label="专业智能">
      <header className="pi-header">
        <div>
          <h1>专业智能</h1>
          <nav className="pi-tabs" aria-label="专业智能类别">
            <button
              type="button"
              aria-current={view === 'organization' ? 'page' : undefined}
              onClick={() => switchView('organization')}
            >
              组织智能载体
            </button>
            <button
              type="button"
              aria-current={view === 'scene' ? 'page' : undefined}
              onClick={() => switchView('scene')}
            >
              场景工作智能体
            </button>
          </nav>
        </div>
        {view === 'organization' ? (
          <label className="pi-search">
            <Search size={16} aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => updateSearch(event.target.value)}
              placeholder="搜索单位或载体"
              aria-label="搜索单位或载体"
            />
            {query ? (
              <button
                type="button"
                aria-label="清除搜索"
                onClick={() => setQuery('')}
              >
                <X size={15} />
              </button>
            ) : null}
          </label>
        ) : null}
      </header>

      {view === 'organization' ? (
        <div className="pi-workspace" data-mobile-step={mobileStep}>
          <aside className="pi-pane pi-unit-pane" aria-label="市直单位">
            <div className="pi-pane-heading">
              <span>市直单位</span>
            </div>
            {units.length ? (
              <ul className="pi-unit-list">
                {units.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={item.id === unitId ? 'is-active' : ''}
                      aria-current={item.id === unitId ? 'true' : undefined}
                      onClick={() => chooseUnit(item.id)}
                    >
                      <span>{item.displayName}</span>
                      <ChevronRight size={15} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="pi-empty-search">
                <strong>未找到相关单位或载体</strong>
                <button type="button" onClick={() => setQuery('')}>
                  清除搜索
                </button>
              </div>
            )}
          </aside>

          <section className="pi-pane pi-carrier-pane" aria-label="单位载体">
            <div className="pi-mobile-back">
              <button type="button" onClick={() => setMobileStep('index')}>
                <ArrowLeft size={15} />返回单位
              </button>
            </div>
            <div className="pi-pane-heading">
              <span>{unit?.displayName || '选择单位'}</span>
            </div>
            <ul className="pi-carrier-list">
              {carriers.map((item) => (
                <li key={item.id}>
                  {item.buildStatus === 'built' ? (
                    <button
                      type="button"
                      className={item.id === carrierId ? 'is-active' : ''}
                      aria-current={item.id === carrierId ? 'true' : undefined}
                      onClick={() => chooseCarrier(item.id)}
                    >
                      <span>{item.displayName}</span>
                      <ChevronRight size={15} aria-hidden="true" />
                    </button>
                  ) : (
                    <span className="pi-static-carrier">{item.displayName}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <article className="pi-pane pi-detail-pane" aria-live="polite">
            <div className="pi-mobile-back">
              <button type="button" onClick={() => setMobileStep('list')}>
                <ArrowLeft size={15} />返回载体
              </button>
            </div>
            {carrier?.buildStatus === 'built' ? (
              <>
                <header className="pi-detail-header">
                  <span className="pi-object-icon" aria-hidden="true">
                    <Network size={20} />
                  </span>
                  <div>
                    <h2>{carrier.displayName}</h2>
                    <p>
                      {unit?.formalName}
                      {carrier.mountStatus === 'cross_functional'
                        ? ' · 跨职能载体 · 具体挂载待确认'
                        : ''}
                    </p>
                  </div>
                </header>
                <section className="pi-detail-section">
                  <h3>职责与边界</h3>
                  <p>{carrier.summary}</p>
                  <p className="pi-boundary">
                    提供材料整理、核对和办理辅助；正式决策、审批与对外发布仍由有权人员完成。
                  </p>
                </section>
                <section className="pi-detail-section">
                  <h3>可提供能力</h3>
                  <ul>
                    {carrier.services?.map((service) => (
                      <li key={service}>
                        <Check size={14} aria-hidden="true" />{service}
                      </li>
                    ))}
                  </ul>
                </section>
                <section className="pi-detail-section pi-detail-grid">
                  <div>
                    <h3>可参与场景</h3>
                    <p>
                      {carrier.relatedSceneAgentIds?.length
                        ? carrier.relatedSceneAgentIds
                            .map(
                              (id) =>
                                state.catalog.find((item) => item.id === id)?.name,
                            )
                            .filter(Boolean)
                            .join('、')
                        : '按任务需要作为岗位支持加入'}
                    </p>
                  </div>
                  <div>
                    <h3>知识与经验</h3>
                    <p>按当前任务授权范围使用资料；新增经验经本人确认后沉淀。</p>
                  </div>
                </section>
                <section className="pi-source">
                  <ShieldCheck size={15} aria-hidden="true" />
                  <span>
                    机构名称与职责来源已核验
                    {carrier.publishedAt
                      ? ` · 发布于${carrier.publishedAt}`
                      : ` · 页面未标注发布日期 · 核验于${organizationRegistryMeta.verifiedAt}`}
                  </span>
                  <a href={carrier.officialUrl} target="_blank" rel="noreferrer">
                    查看来源
                  </a>
                </section>
                <footer className="pi-actions">
                  <button
                    className="pi-primary"
                    type="button"
                    onClick={() =>
                      onConsult(
                        carrier.id,
                        `请介绍${carrier.displayName}可以如何协助本次工作`,
                      )
                    }
                  >
                    发起咨询
                  </button>
                  <button type="button" onClick={() => onUse(carrier.id)}>
                    用于任务
                  </button>
                </footer>
              </>
            ) : (
              <div className="pi-detail-empty">
                <Network size={22} aria-hidden="true" />
                <strong>选择左侧可查看的载体</strong>
                <span>单位内未提供详情入口的名称仅用于组织定位。</span>
              </div>
            )}
          </article>
        </div>
      ) : (
        <div className="pi-workspace pi-scene-workspace" data-mobile-step={mobileStep}>
          <aside className="pi-pane pi-unit-pane" aria-label="工作类型">
            <div className="pi-pane-heading"><span>工作类型</span></div>
            <ul className="pi-unit-list">
              {sceneCategories.map((category) => (
                <li key={category}>
                  <button
                    type="button"
                    className={category === sceneCategory ? 'is-active' : ''}
                    onClick={() => {
                      setSceneCategory(category);
                      const first = scenes.find((item) => item.category === category);
                      if (first) setSceneId(first.id);
                      setMobileStep('list');
                    }}
                  >
                    <span>{category}</span><ChevronRight size={15} />
                  </button>
                </li>
              ))}
            </ul>
          </aside>
          <section className="pi-pane pi-carrier-pane" aria-label="场景工作智能体">
            <div className="pi-mobile-back">
              <button type="button" onClick={() => setMobileStep('index')}>
                <ArrowLeft size={15} />返回工作类型
              </button>
            </div>
            <div className="pi-pane-heading"><span>{sceneCategory}</span></div>
            <ul className="pi-carrier-list">
              {visibleScenes.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={item.id === scene?.id ? 'is-active' : ''}
                    onClick={() => { setSceneId(item.id); setMobileStep('detail'); }}
                  >
                    <span>{item.name}</span><ChevronRight size={15} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
          <article className="pi-pane pi-detail-pane">
            <div className="pi-mobile-back">
              <button type="button" onClick={() => setMobileStep('list')}>
                <ArrowLeft size={15} />返回场景
              </button>
            </div>
            {scene ? (
              <>
                <header className="pi-detail-header">
                  <span className="pi-object-icon" aria-hidden="true"><Bot size={20} /></span>
                  <div><h2>{scene.name}</h2><p>{scene.publisher} · {scene.category}</p></div>
                </header>
                <section className="pi-detail-section">
                  <h3>适用工作</h3><p>{scene.summary}</p>
                </section>
                <section className="pi-detail-section">
                  <h3>处理能力</h3>
                  <ul>{scene.details.map((detail) => <li key={detail}><Check size={14} />{detail}</li>)}</ul>
                </section>
                {sceneProfile ? (
                  <section className="pi-detail-section pi-detail-grid">
                    <div><h3>需要准备</h3><p>{sceneProfile.requiredContext.slice(0, 3).join('、')}</p></div>
                    <div><h3>人工决定</h3><p>{sceneProfile.serviceBoundaries[0]}</p></div>
                  </section>
                ) : null}
                <footer className="pi-actions">
                  {scene.owned ? (
                    <>
                      <button className="pi-primary" type="button" disabled={!scene.enabled} onClick={startScene}>开始工作</button>
                      <button type="button" onClick={() => dispatch({ type: 'catalog', id: scene.id, enabled: !scene.enabled })}>{scene.enabled ? '停用' : '启用'}</button>
                    </>
                  ) : (
                    <button className="pi-primary" type="button" onClick={() => dispatch({ type: 'catalog', id: scene.id, owned: true, enabled: true })}>获取并启用</button>
                  )}
                </footer>
              </>
            ) : null}
          </article>
        </div>
      )}

      {pendingSceneId && scene ? (
        <div className="pi-dialog-backdrop">
          <dialog open className="pi-dialog" aria-labelledby="pi-check-title" onKeyDown={(event) => { if (event.key === 'Escape') setPendingSceneId(''); }}>
            <header><div><span>启动检查</span><h2 id="pi-check-title">{scene.name}</h2></div><button ref={dialogClose} type="button" aria-label="关闭启动检查" onClick={() => setPendingSceneId('')}><X size={17} /></button></header>
            <ul>
              <li><Check size={15} /><span><strong>材料范围</strong>确认本次任务可使用的材料和版本</span></li>
              <li><Check size={15} /><span><strong>系统权限</strong>只在当前身份与组织策略范围内工作</span></li>
              <li><Check size={15} /><span><strong>参与载体</strong>可在任务中继续添加一个或多个岗位支持</span></li>
              <li><Check size={15} /><span><strong>人工决定</strong>关键判断、正式操作和成果提交由本人确认</span></li>
            </ul>
            <footer><button type="button" onClick={() => setPendingSceneId('')}>取消</button><button className="pi-primary" type="button" onClick={() => { const id = pendingSceneId; setPendingSceneId(''); onConsult(id, sceneProfile?.sampleQuestions[0] || `请开始处理${scene.name}对应的工作`); }}>确认并开始</button></footer>
          </dialog>
        </div>
      ) : null}
    </section>
  );
}
