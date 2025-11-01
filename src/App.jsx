import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const GRID_SIZE = 20
const TICK_MS = 120

const DIRS = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
}

function sameCell(a, b) {
  return a.x === b.x && a.y === b.y
}

function inBounds(p) {
  return p.x >= 0 && p.x < GRID_SIZE && p.y >= 0 && p.y < GRID_SIZE
}

function pickFood(occupied) {
  const free = []
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const key = `${x},${y}`
      if (!occupied.has(key)) free.push({ x, y })
    }
  }
  if (free.length === 0) return null
  return free[Math.floor(Math.random() * free.length)]
}

export default function App() {
  const [snake, setSnake] = useState([{ x: Math.floor(GRID_SIZE / 2), y: Math.floor(GRID_SIZE / 2) }])
  const [dir, setDir] = useState(DIRS.ArrowRight)
  const [food, setFood] = useState(() => pickFood(new Set([`${Math.floor(GRID_SIZE/2)},${Math.floor(GRID_SIZE/2)}`])))
  const [gameOver, setGameOver] = useState(false)
  const [running, setRunning] = useState(true)

  const dirRef = useRef(dir)
  const snakeRef = useRef(snake)
  const gameOverRef = useRef(gameOver)
  const runningRef = useRef(running)

  useEffect(() => { dirRef.current = dir }, [dir])
  useEffect(() => { snakeRef.current = snake }, [snake])
  useEffect(() => { gameOverRef.current = gameOver }, [gameOver])
  useEffect(() => { runningRef.current = running }, [running])

  const occupiedSet = useMemo(() => {
    const s = new Set()
    for (const c of snake) s.add(`${c.x},${c.y}`)
    return s
  }, [snake])

  const score = snake.length - 1

  const handleKey = useCallback((e) => {
    if (!(e.key in DIRS)) return
    const next = DIRS[e.key]
    const cur = dirRef.current
    if (snakeRef.current.length > 1) {
      const head = snakeRef.current[0]
      const neck = snakeRef.current[1]
      const reverse = head.x + next.x === neck.x && head.y + next.y === neck.y
      if (reverse) return
    }
    setDir(next)
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === ' ' || e.code === 'Space') {
        setRunning((r) => !r)
        return
      }
      handleKey(e)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleKey])

  const step = useCallback(() => {
    if (gameOverRef.current || !runningRef.current) return
    const curSnake = snakeRef.current
    const curDir = dirRef.current
    const head = curSnake[0]
    const newHead = { x: head.x + curDir.x, y: head.y + curDir.y }

    if (!inBounds(newHead)) {
      setGameOver(true)
      setRunning(false)
      return
    }

    for (let i = 0; i < curSnake.length; i++) {
      if (sameCell(curSnake[i], newHead)) {
        setGameOver(true)
        setRunning(false)
        return
      }
    }

    const willEat = food && sameCell(newHead, food)
    const nextSnake = [newHead, ...curSnake]
    if (!willEat) {
      nextSnake.pop()
    }

    setSnake(nextSnake)

    if (willEat) {
      const nextOccupied = new Set(nextSnake.map(c => `${c.x},${c.y}`))
      const f = pickFood(nextOccupied)
      setFood(f)
    }
  }, [food])

  useEffect(() => {
    const id = setInterval(step, TICK_MS)
    return () => clearInterval(id)
  }, [step])

  const restart = useCallback(() => {
    const start = { x: Math.floor(GRID_SIZE / 2), y: Math.floor(GRID_SIZE / 2) }
    const occ = new Set([`${start.x},${start.y}`])
    setSnake([start])
    setDir(DIRS.ArrowRight)
    setFood(pickFood(occ))
    setGameOver(false)
    setRunning(true)
  }, [])

  const cells = useMemo(() => {
    const set = new Set(snake.map(c => `${c.x},${c.y}`))
    const headKey = `${snake[0].x},${snake[0].y}`
    const arr = []
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const key = `${x},${y}`
        let type = 'cell'
        if (food && key === `${food.x},${food.y}`) type = 'food'
        if (set.has(key)) type = key === headKey ? 'head' : 'snake'
        arr.push({ key, type })
      }
    }
    return arr
  }, [snake, food])

  return (
    <div className="wrap">
      <h1>Snake</h1>
      <div className="hud">
        <div>Score: {score}</div>
        <div>{running ? 'Running' : 'Paused'}{gameOver ? ' · Game Over' : ''}</div>
        <div className="actions">
          <button onClick={restart}>Restart</button>
          <button onClick={() => setRunning(r => !r)}>{running ? 'Pause' : 'Resume'}</button>
        </div>
      </div>
      <div
        className={`board ${gameOver ? 'over' : ''}`}
        style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
      >
        {cells.map(c => (
          <div key={c.key} className={`cell ${c.type}`} />
        ))}
      </div>
      <p className="hint">Arrow keys to move. Space to pause/resume.</p>
    </div>
  )
}
