import React, { useState, useEffect, useCallback } from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { getCodePreview, downloadProject, getSchemaFromText } from './api/generatorApi';
import './App.css';

function App() {
  const [entities, setEntities] = useState([]);
  const [code, setCode] = useState({ 'models.py': '', 'main.py': '' });
  const [activeTab, setActiveTab] = useState('models.py');
  const [llmText, setLlmText] = useState("");
  const [isLoading, setIsLoading] = useState(false);


  const updatePreview = useCallback(() => {
    if (entities.length > 0) {
      const schema = { entities: entities.filter(e => e.name).map(({ id, fields, ...rest }) => ({
        ...rest,
        fields: fields.map(({id, ...fieldRest}) => fieldRest)
      })) };
      
      if (schema.entities.length === 0) return;
      
      getCodePreview(schema)
        .then(data => setCode(data))
        .catch(err => console.error("Failed to fetch preview", err));
    } else {
      setCode({ 'models.py': '// Добавьте сущность, чтобы увидеть код', 'main.py': '' });
    }
  }, [entities]);


  useEffect(() => {
    const handler = setTimeout(() => updatePreview(), 500);
    return () => clearTimeout(handler);
  }, [entities, updatePreview]);


  const handleAddEntity = () => {
    const newEntity = {
      id: Date.now(),
      name: `NewEntity${entities.length + 1}`,
      fields: [{ id: Date.now() + 1, name: 'id', type: 'int' }],
    };
    setEntities([...entities, newEntity]);
  };

  const handleDeleteEntity = (entityId) => {
    setEntities(entities.filter(e => e.id !== entityId));
  };

  const handleEntityChange = (entityId, field, value) => {
    setEntities(entities.map(e => e.id === entityId ? { ...e, [field]: value } : e));
  };
  
  const handleFieldChange = (entityId, fieldId, fieldName, value) => {
    setEntities(entities.map(e => e.id === entityId ? {
      ...e,
      fields: e.fields.map(f => f.id === fieldId ? { ...f, [fieldName]: value } : f)
    } : e));
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

          if (!hasIdField) {
            entity.fields.unshift({
              name: 'id',
              type: 'int'
            });
          }
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
        setLlmText('');

      } catch (error) {
        const errorMessage = error.response?.data?.detail || "Не удалось сгенерировать схему.";
        alert(`Ошибка: ${errorMessage}`);
        console.error("Failed to generate from text", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="app-container">
      {/* --- САЙДБАР --- */}
      <div className="sidebar">
        <h2>Конструктор</h2>
        <button className="button" onClick={handleAddEntity}>Добавить сущность</button>
        
        {entities.map(entity => (
          <div key={entity.id} className="entity-card">
            <div className="entity-header">
              <input
                type="text"
                className="entity-name-input"
                value={entity.name}
                onChange={(e) => handleEntityChange(entity.id, 'name', e.target.value)}
                placeholder="Имя сущности"
              />
              <button className="button-icon" onClick={() => handleDeleteEntity(entity.id)}>✖</button>
            </div>
            <div className="field-list">
              {entity.fields.map(field => (
                <div key={field.id} className="field-row">
                  <input type="text" className="field-input" value={field.name} onChange={(e) => handleFieldChange(entity.id, field.id, 'name', e.target.value)} />
                  <input type="text" className="field-input" value={field.type} onChange={(e) => handleFieldChange(entity.id, field.id, 'type', e.target.value)} />
                  <button className="button-icon" onClick={() => handleDeleteField(entity.id, field.id)}>—</button>
                </div>
              ))}
            </div>
            <button className="button-icon" style={{marginTop: '10px'}} onClick={() => handleAddField(entity.id)}>+ Добавить поле</button>
          </div>
        ))}

        <div className='llm-section'>
          <h2>Генерация из текста</h2>
          <textarea
            rows="6"
            placeholder="Например: 'Система для блога. Сущности: Пост (заголовок, содержание) и Автор (имя)'"
            value={llmText}
            onChange={(e) => setLlmText(e.target.value)}
          />
          <button className="button" style={{ marginTop: '10px', width: '100%' }} onClick={handleLlmGenerate} disabled={isLoading}>
            {isLoading ? 'Генерация...' : 'Заполнить конструктор'}
          </button>
        </div>
      </div>

      {/* --- ОСНОВНОЙ КОНТЕНТ --- */}
      <div className="main-content">
        <header>
          <h1>Генератор кода</h1>
          <button className="button" onClick={handleDownload} disabled={entities.length === 0}>
            Скачать проект (.zip)
          </button>
        </header>
        <div className="code-tabs">
          <div className={`tab ${activeTab === 'models.py' ? 'active' : ''}`} onClick={() => setActiveTab('models.py')}>models.py</div>
          <div className={`tab ${activeTab === 'main.py' ? 'active' : ''}`} onClick={() => setActiveTab('main.py')}>main.py</div>
        </div>
        <SyntaxHighlighter
          language="python"
          style={atomOneDark}
          customStyle={{ margin: 0, height: '100%', flexGrow: 1, overflowY: 'auto' }}
          showLineNumbers
        >
          {code[activeTab] || ''}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

export default App;