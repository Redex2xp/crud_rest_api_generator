// frontend/src/App.jsx

import React, { useState, useEffect, useCallback } from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { getCodePreview, downloadProject, getSchemaFromText } from './api/generatorApi';
import './App.css';

// --- Вспомогательный компонент иконки ---
const MaterialIcon = ({ name }) => (
  <span className="material-icons-outlined">{name}</span>
);

const DEFAULT_CODE = {
  'models.py': '',
  'main.py': '',
  'tests.py': '',
};

function App() {
  const [entities, setEntities] = useState([]);
  const [code, setCode] = useState(DEFAULT_CODE);
  const [activeTab, setActiveTab] = useState('models.py');
  const [llmText, setLlmText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState('builder');

  const scrollToDesigner = () => {
    const designer = document.getElementById('schema-designer');
    if (designer) {
      designer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const goToPreview = () => setViewMode('preview');
  const goToBuilder = () => {
    setViewMode('builder');
    setTimeout(() => scrollToDesigner(), 150);
  };

  // --- Обновление превью ---
  const updatePreview = useCallback(() => {
    if (entities.length > 0) {
      const schema = { entities: entities.filter(e => e.name).map(({ id, fields, ...rest }) => ({
        ...rest,
        fields: fields.map(({id, ...fieldRest}) => fieldRest)
      })) };
      
      if (schema.entities.length === 0) return;
      
      getCodePreview(schema)
        .then(data => {
          setCode(prev => ({ ...DEFAULT_CODE, ...prev, ...data }));
          setActiveTab(tab => (tab in (data || {}) ? tab : 'models.py'));
        })
        .catch(err => console.error("Failed to fetch preview", err));
    } else {
      setCode({
        'models.py': '// Добавьте сущность, чтобы увидеть код',
        'main.py': '',
        'tests.py': '// Здесь появятся автотесты для API',
      });
    }
  }, [entities]);

  useEffect(() => {
    const handler = setTimeout(() => updatePreview(), 500);
    return () => clearTimeout(handler);
  }, [entities, updatePreview]);

  // --- Обработчики ---
  const handleAddEntity = () => {
    if (viewMode !== 'builder') setViewMode('builder');
    const newEntity = {
      id: Date.now(),
      name: `NewEntity${entities.length + 1}`,
      fields: [{ id: Date.now() + 1, name: 'id', type: 'int' }],
    };
    setEntities([...entities, newEntity]);
    setTimeout(() => scrollToDesigner(), 200);
  };

  const handleDeleteEntity = (entityId) => {
    setEntities(entities.filter(e => e.id !== entityId));
  };

  const handleEntityChange = (entityId, field, value) => {
    setEntities(entities.map(e => e.id === entityId ? { ...e, [field]: value } : e));
  };
  
  const handleFieldChange = (entityId, fieldId, fieldName, value) => {
    setEntities(entities.map(e => {
        if (e.id !== entityId) return e;
        return {
            ...e,
            fields: e.fields.map(f => {
                if (f.id !== fieldId) return f;
                if (fieldName === 'relation') {
                    if (value) {
                        const newFieldName = value.charAt(0).toLowerCase() + value.slice(1) + '_id';
                        return { ...f, name: newFieldName, type: 'int', relation: { target_entity: value } };
                    }
                    const { relation, ...rest } = f;
                    return rest;
                }
                return { ...f, [fieldName]: value };
            })
        };
    }));
  };

  const handleAddField = (entityId) => {
    const newField = { id: Date.now(), name: 'new_field', type: 'str' };
    setEntities(entities.map(e => e.id === entityId ? { ...e, fields: [...e.fields, newField] } : e));
  };

  const handleDeleteField = (entityId, fieldId) => {
    setEntities(entities.map(e => e.id === entityId ? {
      ...e,
      fields: e.fields.filter(f => f.id !== fieldId)
    } : e));
  };

  const handleDownload = () => {
    const schema = { entities: entities.filter(e => e.name).map(({ id, fields, ...rest }) => ({
        ...rest,
        fields: fields.map(({id, ...fieldRest}) => fieldRest)
      })) };
    downloadProject(schema);
  };
  
  const handleLlmGenerate = async () => {
    if (llmText.trim()) {
      setIsLoading(true);
      try {
        const schema = await getSchemaFromText(llmText.trim());
        const entitiesWithIds = schema.entities.map((entity, index) => {
          const hasIdField = entity.fields.some(field => field.name.toLowerCase() === 'id');
          if (!hasIdField) entity.fields.unshift({ name: 'id', type: 'int' });
          return {
            ...entity,
            id: Date.now() + index,
            fields: entity.fields.map((field, fieldIndex) => ({
              ...field,
              id: Date.now() + index + fieldIndex + 1000,
            })),
          };
        });
        setEntities(entitiesWithIds);
        setViewMode('builder');
        setTimeout(() => scrollToDesigner(), 200);
        setLlmText('');
      } catch (error) {
        const errorMessage = error.response?.data?.detail || "Не удалось сгенерировать схему.";
        alert(`Ошибка: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="page">
      <div className="page-backdrop page-backdrop--primary" />
      <div className="page-backdrop page-backdrop--secondary" />

      {/*
       <header className="hero">
        <div className="hero-text">
          <span className="hero-badge">beta</span>
          <h1>Генератор CRUD API</h1>
          <p>Соберите схему данных и получите готовый FastAPI-проект за считанные секунды.</p>
          <div className="hero-actions">
            <button className="button primary with-icon" type="button" onClick={handleAddEntity}>
              <MaterialIcon name="add_circle" />
              <span>Новая сущность</span>
            </button>
            <button
              className="button ghost with-icon"
              type="button"
              onClick={viewMode === 'preview' ? goToBuilder : goToPreview}
            >
              <MaterialIcon name={viewMode === 'preview' ? 'view_kanban' : 'code'} />
              <span>{viewMode === 'preview' ? 'К конструктору' : 'Просмотр кода'}</span>
            </button>
          </div>
        </div>
        <div className="hero-cards">
          <div className="hero-card"><div className="hero-icon"><MaterialIcon name="draw" /></div><h3>Интерактивное моделирование</h3></div>
          <div className="hero-card"><div className="hero-icon"><MaterialIcon name="auto_fix_high" /></div><h3>Генерация из описания</h3></div>
          <div className="hero-card"><div className="hero-icon"><MaterialIcon name="cloud_download" /></div><h3>Экспорт проекта</h3></div>
        </div>
      </header> 
      */}

      {/* ОСНОВНОЙ КОНТЕЙНЕР */}
      <div id="schema-designer" className={`app-container view-${viewMode}`}>
        
        {/* === РЕЖИМ КОНСТРУКТОРА (2 колонки) === */}
        {viewMode === 'builder' && (
          <>
            {/* ЛЕВАЯ КОЛОНКА: Генерация текста */}
            <aside className="generator-aside">
              <div className="card accent generator-card">
                <h3 className="card-title">Генерация из текста</h3>
                <textarea 
                  className="md-input md-input--large textarea" 
                  rows="8" 
                  placeholder="Опишите ваши сущности..." 
                  value={llmText} 
                  onChange={(e) => setLlmText(e.target.value)} 
                />
                <button 
                  className="button primary with-icon" 
                  style={{marginTop: '16px', width: '100%'}} 
                  onClick={handleLlmGenerate} 
                  disabled={isLoading}
                >
                  {isLoading ? 'Генерация...' : 'Сгенерировать'}
                </button>
              </div>
            </aside>

            {/* ПРАВАЯ КОЛОНКА: Конструктор сущностей */}
            <aside className="sidebar">
              <div className="sidebar-head">
                <h2 className="sidebar-header">Конструктор</h2>
                <div className="sidebar-actions">
                  <button className="toggle-button" type="button" onClick={goToPreview}>
                    <MaterialIcon name="code" />
                    <span>Просмотр кода</span>
                  </button>
                  <button className="fab fab--mini" onClick={handleAddEntity} title="Добавить сущность">
                    <MaterialIcon name="add" />
                  </button>
                </div>
              </div>

              {entities.length === 0 && (
                <div className="empty-placeholder">
                  <h3>Начните со структуры</h3>
                  <p>Добавьте сущность вручную или опишите модель слева.</p>
                  <button className="button secondary with-icon" type="button" onClick={handleAddEntity}>
                    <MaterialIcon name="add" />
                    <span>Добавить сущность</span>
                  </button>
                </div>
              )}

              <div className="entity-list">
                {entities.map(entity => (
                  <div key={entity.id} className="card entity-card">
                    <div className="card-header">
                      <input type="text" className="md-input md-input--entity" style={{fontWeight: 500}} value={entity.name} onChange={(e) => handleEntityChange(entity.id, 'name', e.target.value)} placeholder="Имя сущности"/>
                      <button className="icon-button danger" onClick={() => handleDeleteEntity(entity.id)}><MaterialIcon name="delete_outline" /></button>
                    </div>
                    <div className="field-list">
                      {entity.fields.map(field => (
                        <div key={field.id} className="field-row">
                          <input type="text" className="md-input md-input--large" value={field.name} onChange={(e) => handleFieldChange(entity.id, field.id, 'name', e.target.value)} placeholder="Имя поля"/>
                          <div className="select-wrapper select-wrapper--type">
                            <select className="md-input md-input--large select" value={field.type} onChange={(e) => handleFieldChange(entity.id, field.id, 'type', e.target.value)}>
                                <option value="int">int</option>
                                <option value="str">str</option>
                                <option value="float">float</option>
                                <option value="bool">bool</option>
                                <option value="datetime">datetime</option>
                                <option value="text">text</option>
                            </select>
                            <span className="select-icon"><MaterialIcon name="expand_more" /></span>
                          </div>
                          <div className="select-wrapper">
                            <select className="md-input md-input--large select" value={field.relation?.target_entity || ''} onChange={(e) => handleFieldChange(entity.id, field.id, 'relation', e.target.value)}>
                                <option value="">-- Связь --</option>
                                {entities.filter(e => e.id !== entity.id && e.name).map(target => (
                                    <option key={target.id} value={target.name}>→ {target.name}</option>
                                ))}
                            </select>
                            <span className="select-icon"><MaterialIcon name="expand_more" /></span>
                          </div>
                          <button className="icon-button danger large" onClick={() => handleDeleteField(entity.id, field.id)}><MaterialIcon name="remove_circle_outline" /></button>
                        </div>
                      ))}
                    </div>
                    <button className="pill-button with-icon" onClick={() => handleAddField(entity.id)}>
                      <MaterialIcon name="add" /><span>Новое поле</span>
                    </button>
                  </div>
                ))}
              </div>
            </aside>
          </>
        )}

        {/* === РЕЖИМ ПРОСМОТРА (1 колонка на всю ширину) === */}
        {viewMode === 'preview' && (
          <main className="main-content">
            <header className="app-bar">
              <div><span className="app-bar-eyebrow">Превью проекта</span><span className="app-bar-title">Генератор кода</span></div>
              <div className="app-bar-actions">
                <button className="toggle-button" onClick={goToBuilder}><MaterialIcon name="arrow_back" /><span>К конструктору</span></button>
                <button className="icon-button square-button prominent" onClick={handleDownload} disabled={entities.length === 0}><MaterialIcon name="download" /></button>
              </div>
            </header>
            <div className="code-tabs">
              {['models.py', 'main.py', 'tests.py'].map(tab => (
                <div key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</div>
              ))}
            </div>
            <div className="code-preview">
              <SyntaxHighlighter language="python" style={atomOneDark} customStyle={{ margin: 0, background: 'transparent', height: '100%' }} showLineNumbers>
                {code[activeTab] || ''}
              </SyntaxHighlighter>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}

export default App;