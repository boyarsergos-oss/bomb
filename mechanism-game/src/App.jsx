import React, { useState, useRef, useEffect } from 'react';
import './App.css';

// Типы блоков
const BLOCK_TYPES = {
  SOURCE: { id: 'source', name: 'Источник', color: '#4CAF50', symbol: '⚡', description: 'Даёт энергию' },
  WIRE: { id: 'wire', name: 'Провод', color: '#FF9800', symbol: '─', description: 'Передаёт сигнал' },
  SWITCH: { id: 'switch', name: 'Переключатель', color: '#2196F3', symbol: '⏻', description: 'Вкл/Выкл' },
  GATE_AND: { id: 'gate_and', name: 'И (AND)', color: '#9C27B0', symbol: '&', description: 'Все входы активны' },
  GATE_OR: { id: 'gate_or', name: 'ИЛИ (OR)', color: '#E91E63', symbol: '≥1', description: 'Хотя бы один вход' },
  GATE_NOT: { id: 'gate_not', name: 'НЕ (NOT)', color: '#607D8B', symbol: '¬', description: 'Инвертирует сигнал' },
  MOTOR: { id: 'motor', name: 'Мотор', color: '#795548', symbol: '⟳', description: 'Вращается при сигнале' },
  LAMP: { id: 'lamp', name: 'Лампа', color: '#FFEB3B', symbol: '💡', description: 'Светится при сигнале' },
  PISTON: { id: 'piston', name: 'Поршень', color: '#00BCD4', symbol: '⇄', description: 'Двигается при сигнале' },
  DELAY: { id: 'delay', name: 'Задержка', color: '#3F51B5', symbol: '⏱', description: 'Задерживает сигнал' },
};

// Начальный блок
const INITIAL_BLOCK = {
  id: 'block-1',
  type: 'SOURCE',
  x: window.innerWidth / 2 - 40,
  y: window.innerHeight / 3 - 40,
  rotation: 0,
  powered: true,
  state: true,
};

function App() {
  const [blocks, setBlocks] = useState([INITIAL_BLOCK]);
  const [connections, setConnections] = useState([]);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [draggingBlock, setDraggingBlock] = useState(null);
  const [connectingFrom, setConnectingFrom] = useState(null);
  const [showPanel, setShowPanel] = useState(false);
  const [simulationRunning, setSimulationRunning] = useState(true);
  
  const canvasRef = useRef(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Логическая симуляция
  useEffect(() => {
    if (!simulationRunning) return;

    const simulate = () => {
      setBlocks(prevBlocks => {
        const newBlocks = prevBlocks.map(block => ({ ...block, powered: false }));
        
        // Сначала активируем источники
        newBlocks.forEach(block => {
          if (block.type === 'SOURCE') {
            block.powered = true;
          }
        });

        // Распространяем сигнал через соединения
        let changed = true;
        let iterations = 0;
        while (changed && iterations < 10) {
          changed = false;
          iterations++;

          connections.forEach(conn => {
            const fromBlock = newBlocks.find(b => b.id === conn.from);
            const toBlock = newBlocks.find(b => b.id === conn.to);

            if (fromBlock && toBlock && fromBlock.powered) {
              if (!toBlock.powered) {
                toBlock.powered = true;
                changed = true;
              }
            }
          });

          // Обрабатываем логические элементы
          newBlocks.forEach(block => {
            if (block.type === 'SWITCH') {
              block.powered = block.state;
            } else if (block.type === 'GATE_NOT') {
              const inputConn = connections.find(c => c.to === block.id);
              if (inputConn) {
                const inputBlock = newBlocks.find(b => b.id === inputConn.from);
                if (inputBlock) {
                  block.powered = !inputBlock.powered;
                }
              }
            } else if (block.type === 'GATE_AND' || block.type === 'GATE_OR') {
              const inputConns = connections.filter(c => c.to === block.id);
              const inputs = inputConns.map(c => {
                const b = newBlocks.find(bl => bl.id === c.from);
                return b ? b.powered : false;
              });

              if (inputs.length > 0) {
                if (block.type === 'GATE_AND') {
                  block.powered = inputs.every(i => i);
                } else {
                  block.powered = inputs.some(i => i);
                }
              }
            }
          });
        }

        return newBlocks;
      });
    };

    const interval = setInterval(simulate, 100);
    return () => clearInterval(interval);
  }, [connections, simulationRunning]);

  // Обработка касаний и мыши
  const handlePointerDown = (e, blockId) => {
    e.preventDefault();
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    setSelectedBlockId(blockId);
    setDraggingBlock(blockId);
    dragOffset.current = {
      x: clientX - block.x,
      y: clientY - block.y,
    };
  };

  const handlePointerMove = (e) => {
    if (!draggingBlock) return;
    e.preventDefault();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    setBlocks(prev => prev.map(block => 
      block.id === draggingBlock
        ? { ...block, x: clientX - dragOffset.current.x, y: clientY - dragOffset.current.y }
        : block
    ));
  };

  const handlePointerUp = () => {
    setDraggingBlock(null);
  };

  const handleDoubleClick = (e, blockId) => {
    e.preventDefault();
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    if (block.type === 'SWITCH') {
      setBlocks(prev => prev.map(b => 
        b.id === blockId ? { ...b, state: !b.state } : b
      ));
    }
  };

  const addBlock = (typeKey) => {
    const newBlock = {
      id: `block-${Date.now()}`,
      type: typeKey,
      x: window.innerWidth / 2 - 40 + Math.random() * 100,
      y: window.innerHeight / 2 - 40 + Math.random() * 100,
      rotation: 0,
      powered: false,
      state: false,
    };
    setBlocks(prev => [...prev, newBlock]);
    setShowPanel(false);
  };

  const startConnection = (e, blockId) => {
    e.stopPropagation();
    setConnectingFrom(blockId);
  };

  const completeConnection = (e, targetBlockId) => {
    e.stopPropagation();
    if (connectingFrom && connectingFrom !== targetBlockId) {
      const exists = connections.find(
        c => (c.from === connectingFrom && c.to === targetBlockId) ||
             (c.from === targetBlockId && c.to === connectingFrom)
      );
      
      if (!exists) {
        setConnections(prev => [...prev, { from: connectingFrom, to: targetBlockId }]);
      }
    }
    setConnectingFrom(null);
  };

  const deleteSelected = () => {
    if (selectedBlockId) {
      setBlocks(prev => prev.filter(b => b.id !== selectedBlockId));
      setConnections(prev => prev.filter(c => c.from !== selectedBlockId && c.to !== selectedBlockId));
      setSelectedBlockId(null);
    }
  };

  const rotateSelected = () => {
    if (selectedBlockId) {
      setBlocks(prev => prev.map(b => 
        b.id === selectedBlockId ? { ...b, rotation: (b.rotation + 90) % 360 } : b
      ));
    }
  };

  return (
    <div className="app">
      <div className="header">
        <h1>🔧 Механизмы</h1>
        <div className="controls">
          <button onClick={() => setShowPanel(!showPanel)} className="btn-add">
            ➕ Блок
          </button>
          <button onClick={deleteSelected} disabled={!selectedBlockId} className="btn-delete">
            🗑️
          </button>
          <button onClick={rotateSelected} disabled={!selectedBlockId} className="btn-rotate">
            🔄
          </button>
        </div>
      </div>

      <div 
        className="canvas"
        ref={canvasRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onClick={() => {
          if (connectingFrom) setConnectingFrom(null);
        }}
      >
        {/* Соединения */}
        <svg className="connections">
          {connections.map((conn, idx) => {
            const from = blocks.find(b => b.id === conn.from);
            const to = blocks.find(b => b.id === conn.to);
            if (!from || !to) return null;

            const fromPowered = blocks.find(b => b.id === conn.from)?.powered;
            
            return (
              <line
                key={idx}
                x1={from.x + 40}
                y1={from.y + 40}
                x2={to.x + 40}
                y2={to.y + 40}
                stroke={fromPowered ? '#00ff00' : '#666'}
                strokeWidth="4"
                className="connection-line"
              />
            );
          })}
          
          {/* Линия от текущего блока при создании соединения */}
          {connectingFrom && (
            <circle
              cx={blocks.find(b => b.id === connectingFrom)?.x + 40}
              cy={blocks.find(b => b.id === connectingFrom)?.y + 40}
              r="10"
              fill="#00ff00"
              className="pulse"
            />
          )}
        </svg>

        {/* Блоки */}
        {blocks.map(block => {
          const blockType = Object.values(BLOCK_TYPES).find(t => t.id === block.type);
          return (
            <div
              key={block.id}
              className={`block ${selectedBlockId === block.id ? 'selected' : ''} ${connectingFrom === block.id ? 'connecting' : ''}`}
              style={{
                left: block.x,
                top: block.y,
                backgroundColor: block.powered ? blockType.color : '#333',
                transform: `rotate(${block.rotation}deg)`,
                boxShadow: block.powered ? `0 0 20px ${blockType.color}` : 'none',
              }}
              onPointerDown={(e) => handlePointerDown(e, block.id)}
              onDoubleClick={(e) => handleDoubleClick(e, block.id)}
              onClick={(e) => {
                e.stopPropagation();
                if (connectingFrom) {
                  completeConnection(e, block.id);
                } else {
                  setSelectedBlockId(block.id);
                }
              }}
            >
              <div className="block-symbol">{blockType.symbol}</div>
              {block.type === 'SWITCH' && (
                <div className={`switch-indicator ${block.state ? 'on' : 'off'}`}></div>
              )}
              {connectingFrom && connectingFrom !== block.id && (
                <div 
                  className="connect-hint"
                  onClick={(e) => completeConnection(e, block.id)}
                >
                  🔗
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Панель добавления блоков */}
      {showPanel && (
        <div className="block-panel">
          <h3>Добавить блок</h3>
          <div className="block-grid">
            {Object.entries(BLOCK_TYPES).map(([key, type]) => (
              <button
                key={key}
                className="block-btn"
                style={{ backgroundColor: type.color }}
                onClick={() => addBlock(key)}
              >
                <span className="block-btn-symbol">{type.symbol}</span>
                <span className="block-btn-name">{type.name}</span>
              </button>
            ))}
          </div>
          <button className="close-panel" onClick={() => setShowPanel(false)}>✕</button>
        </div>
      )}

      {/* Подсказка */}
      <div className="hint">
        <p>👆 Тап для выбора • Двойной тап на переключатель • 🔗 для соединения</p>
      </div>
    </div>
  );
}

export default App;
