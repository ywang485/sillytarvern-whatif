'use client'

import { useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
} from '@xyflow/react'
import dagre from '@dagrejs/dagre'
import '@xyflow/react/dist/style.css'
import { ChapterNode } from './ChapterNode'
import { BranchNode } from './BranchNode'
import type { NarrativeStructure } from '@/types'

const NODE_TYPES = {
  chapter: ChapterNode,
  branch: BranchNode,
}

const NODE_WIDTH = 260
const NODE_HEIGHT = 120
const BRANCH_HEIGHT = 100

function layoutGraph(nodes: Node[], edges: Edge[]) {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'TB', ranksep: 80, nodesep: 30 })

  nodes.forEach((node) => {
    g.setNode(node.id, {
      width: NODE_WIDTH,
      height: node.type === 'chapter' ? NODE_HEIGHT : BRANCH_HEIGHT,
    })
  })

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target)
  })

  dagre.layout(g)

  return nodes.map((node) => {
    const pos = g.node(node.id)
    return {
      ...node,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - (node.type === 'chapter' ? NODE_HEIGHT : BRANCH_HEIGHT) / 2,
      },
    }
  })
}

interface Props {
  narrative: NarrativeStructure
}

export function StoryTreeView({ narrative }: Props) {
  const { nodes, edges } = useMemo(() => {
    const rawNodes: Node[] = []
    const rawEdges: Edge[] = []

    let prevBottleneckId: string | null = null

    for (const chapter of narrative.chapters) {
      const bottleneckNodeId = `bottleneck-${chapter.id}`

      // Bottleneck node
      rawNodes.push({
        id: bottleneckNodeId,
        type: 'chapter',
        position: { x: 0, y: 0 },
        data: {
          chapterNumber: chapter.chapterNumber,
          title: chapter.title,
          bottleneckTitle: chapter.bottleneck.title,
          bottleneckText: chapter.bottleneck.text,
          worldStateAfter: chapter.bottleneck.worldStateAfter,
        },
      })

      // Branch nodes
      for (let i = 0; i < chapter.branches.length; i++) {
        const branch = chapter.branches[i]
        const branchNodeId = `branch-${branch.id}`

        rawNodes.push({
          id: branchNodeId,
          type: 'branch',
          position: { x: 0, y: 0 },
          data: {
            title: branch.title,
            summary: branch.summary,
            fullText: branch.fullText,
            worldStateEffects: branch.worldStateEffects,
            branchIndex: i,
          },
        })

        // Edge: previous bottleneck → branch (or start → branch for ch1)
        if (prevBottleneckId) {
          rawEdges.push({
            id: `edge-${prevBottleneckId}-${branchNodeId}`,
            source: prevBottleneckId,
            target: branchNodeId,
            style: { stroke: '#6d28d9', strokeWidth: 1.5, opacity: 0.6 },
            animated: false,
          })
        } else {
          // First chapter: connect a virtual "start" or just branches floating
        }

        // Edge: branch → bottleneck
        rawEdges.push({
          id: `edge-${branchNodeId}-${bottleneckNodeId}`,
          source: branchNodeId,
          target: bottleneckNodeId,
          style: { stroke: '#d97706', strokeWidth: 1.5, opacity: 0.8 },
          animated: false,
        })
      }

      // If first chapter, add a "Start" node linking to branches
      if (!prevBottleneckId && chapter.branches.length > 0) {
        const startId = 'start'
        rawNodes.unshift({
          id: startId,
          type: 'input',
          position: { x: 0, y: 0 },
          data: { label: '▶ Begin Story' },
          style: {
            background: '#1e293b',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '8px',
            color: '#94a3b8',
            fontSize: '12px',
            padding: '8px 16px',
          },
        })

        for (const branch of chapter.branches) {
          rawEdges.push({
            id: `edge-start-branch-${branch.id}`,
            source: startId,
            target: `branch-${branch.id}`,
            style: { stroke: '#475569', strokeWidth: 1, opacity: 0.5 },
          })
        }
      }

      prevBottleneckId = bottleneckNodeId
    }

    const layouted = layoutGraph(rawNodes, rawEdges)
    return { nodes: layouted, edges: rawEdges }
  }, [narrative])

  return (
    <div className="h-full w-full" style={{ background: '#0a0f1e' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        fitView
        fitViewOptions={{ padding: 0.1 }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#1e293b" gap={24} size={1} />
        <Controls className="!bg-slate-900 !border-white/10" />
        <MiniMap
          nodeColor={(node) =>
            node.type === 'chapter' ? '#d97706' : '#6d28d9'
          }
          maskColor="rgba(0,0,0,0.7)"
          className="!bg-slate-900 !border-white/10"
        />
      </ReactFlow>
    </div>
  )
}
