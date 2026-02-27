<script lang="ts">
	import type { Pipeline } from '$lib/types';
	import PipelineNodeComponent from './PipelineNode.svelte';
	import { STAGE_ORDER, STAGE_X, STAGE_LABELS } from '$lib/utils/classifier';

	interface Props {
		pipeline: Pipeline | null;
	}

	let { pipeline }: Props = $props();

	// Check if pipeline has stage-based nodes
	const hasStages = $derived(
		pipeline ? pipeline.nodes.some((n) => n.devStage) : false
	);

	let svgElement: SVGSVGElement | undefined = $state();
	let viewBox = $state({ x: -40, y: -20, w: 1200, h: 680 });
	let isPanning = $state(false);
	let panStart = $state({ x: 0, y: 0 });
	let zoom = $state(1);

	let viewBoxStr = $derived(
		`${viewBox.x} ${viewBox.y} ${viewBox.w / zoom} ${viewBox.h / zoom}`
	);

	function handleWheel(e: WheelEvent) {
		e.preventDefault();
		const delta = e.deltaY > 0 ? 0.9 : 1.1;
		const newZoom = Math.max(0.3, Math.min(3, zoom * delta));
		zoom = newZoom;
	}

	function handleMouseDown(e: MouseEvent) {
		if (e.button === 0) {
			isPanning = true;
			panStart = { x: e.clientX, y: e.clientY };
		}
	}

	function handleMouseMove(e: MouseEvent) {
		if (isPanning) {
			const dx = (e.clientX - panStart.x) / zoom;
			const dy = (e.clientY - panStart.y) / zoom;
			viewBox = { ...viewBox, x: viewBox.x - dx, y: viewBox.y - dy };
			panStart = { x: e.clientX, y: e.clientY };
		}
	}

	function handleMouseUp() {
		isPanning = false;
	}

	function resetView() {
		viewBox = { x: -40, y: -20, w: 1200, h: 680 };
		zoom = 1;
	}

	function zoomIn() {
		zoom = Math.min(3, zoom * 1.2);
	}

	function zoomOut() {
		zoom = Math.max(0.3, zoom / 1.2);
	}

	function getEdgePath(sourceX: number, sourceY: number, targetX: number, targetY: number): string {
		const midY = (sourceY + targetY) / 2;
		// When nodes share the same X (within-stage), offset control points so the curve arcs outward
		const sameColumn = Math.abs(sourceX - targetX) < 10;
		const cp1x = sameColumn ? sourceX + 60 : sourceX;
		const cp2x = sameColumn ? targetX + 60 : targetX;
		return `M ${sourceX} ${sourceY + 32} C ${cp1x} ${midY}, ${cp2x} ${midY}, ${targetX} ${targetY - 32}`;
	}
</script>

<div class="relative h-full w-full overflow-hidden bg-[var(--dash-bg)]">
	<!-- Grid background -->
	<div class="absolute inset-0 opacity-[0.03]" style="background-image: radial-gradient(circle, var(--dash-text) 1px, transparent 1px); background-size: 24px 24px;"></div>

	{#if pipeline && pipeline.nodes.length > 0}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<svg
			bind:this={svgElement}
			class="h-full w-full"
			viewBox={viewBoxStr}
			onwheel={handleWheel}
			onmousedown={handleMouseDown}
			onmousemove={handleMouseMove}
			onmouseup={handleMouseUp}
			onmouseleave={handleMouseUp}
			style:cursor={isPanning ? 'grabbing' : 'grab'}
		>
			<defs>
				<!-- Arrow marker -->
				<marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
					<polygon points="0 0, 8 3, 0 6" fill="var(--dash-border)" />
				</marker>
				<marker id="arrowhead-active" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
					<polygon points="0 0, 8 3, 0 6" fill="var(--dash-accent)" />
				</marker>
			</defs>

			<!-- Stage lane backgrounds -->
			{#if hasStages}
				{#each STAGE_ORDER as stage, i}
					{@const sx = STAGE_X[stage]}
					{@const stageNodes = pipeline?.nodes.filter((n) => n.devStage === stage) ?? []}
					{@const laneH = Math.max(200, stageNodes.length * 120 + 80)}
					<!-- Lane background -->
					<rect
						x={sx - 80}
						y={-10}
						width={160}
						height={laneH}
						rx="8"
						fill="var(--dash-text)"
						opacity="0.02"
					/>
					<!-- Lane header -->
					<text
						x={sx}
						y={-20}
						text-anchor="middle"
						fill="var(--dash-text-dim)"
						font-size="11"
						font-weight="600"
						opacity="0.5"
					>
						{STAGE_LABELS[stage]}
					</text>
					<!-- Node count badge -->
					{#if stageNodes.length > 0}
						<text
							x={sx}
							y={laneH + 8}
							text-anchor="middle"
							fill="var(--dash-text-dim)"
							font-size="9"
							opacity="0.35"
						>
							{stageNodes.length} item{stageNodes.length !== 1 ? 's' : ''}
						</text>
					{/if}
					<!-- Arrow between stages -->
					{#if i < STAGE_ORDER.length - 1}
						{@const nextX = STAGE_X[STAGE_ORDER[i + 1]]}
						<line
							x1={sx + 80}
							y1={30}
							x2={nextX - 80}
							y2={30}
							stroke="var(--dash-border)"
							stroke-width="1"
							stroke-dasharray="6 4"
							opacity="0.3"
						/>
						<polygon
							points="{nextX - 82},{30} {nextX - 90},{26} {nextX - 90},{34}"
							fill="var(--dash-border)"
							opacity="0.3"
						/>
					{/if}
				{/each}
			{/if}

			<!-- Edges -->
			{#each pipeline.edges as edge (edge.id)}
				{@const sourceNode = pipeline.nodes.find(n => n.id === edge.source)}
				{@const targetNode = pipeline.nodes.find(n => n.id === edge.target)}
				{#if sourceNode && targetNode}
					<path
						d={getEdgePath(sourceNode.x, sourceNode.y, targetNode.x, targetNode.y)}
						fill="none"
						stroke={edge.active ? 'var(--dash-accent)' : 'var(--dash-border)'}
						stroke-width={edge.active ? 2 : 1.5}
						marker-end={edge.active ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
						class={edge.active ? 'animate-edge-flow' : ''}
						opacity={edge.active ? 1 : 0.5}
					/>
				{/if}
			{/each}

			<!-- Nodes -->
			{#each pipeline.nodes as node (node.id)}
				<PipelineNodeComponent {node} />
			{/each}
		</svg>
	{:else}
		<!-- Empty state -->
		<div class="flex h-full items-center justify-center">
			<div class="text-center">
				<svg class="mx-auto mb-4 h-16 w-16 text-[var(--dash-border)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
				</svg>
				<p class="text-sm text-[var(--dash-text-dim)]">No active pipeline</p>
				<p class="mt-1 text-xs text-[var(--dash-text-dim)]/60">Run a pipeline to see real-time visualization</p>
			</div>
		</div>
	{/if}

	<!-- Zoom controls -->
	<div class="absolute bottom-3 right-3 flex flex-col gap-1">
		<button
			class="flex h-7 w-7 items-center justify-center rounded border border-[var(--dash-border)] bg-[var(--dash-panel)] text-[var(--dash-text-dim)] hover:bg-[var(--dash-border)] hover:text-[var(--dash-text)] transition-colors"
			onclick={zoomIn}
			title="Zoom in"
		>
			<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v12m6-6H6" />
			</svg>
		</button>
		<button
			class="flex h-7 w-7 items-center justify-center rounded border border-[var(--dash-border)] bg-[var(--dash-panel)] text-[var(--dash-text-dim)] hover:bg-[var(--dash-border)] hover:text-[var(--dash-text)] transition-colors"
			onclick={zoomOut}
			title="Zoom out"
		>
			<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 12H6" />
			</svg>
		</button>
		<button
			class="flex h-7 w-7 items-center justify-center rounded border border-[var(--dash-border)] bg-[var(--dash-panel)] text-[var(--dash-text-dim)] hover:bg-[var(--dash-border)] hover:text-[var(--dash-text)] transition-colors"
			onclick={resetView}
			title="Reset view"
		>
			<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
			</svg>
		</button>
	</div>

	<!-- Pipeline status badge -->
	{#if pipeline}
		<div class="absolute left-3 top-3 flex items-center gap-2 rounded border border-[var(--dash-border)] bg-[var(--dash-panel)] px-2 py-1">
			<span class="h-2 w-2 rounded-full {pipeline.status === 'running' ? 'bg-[var(--dash-accent)] animate-pulse' : pipeline.status === 'complete' ? 'bg-[var(--dash-success)]' : pipeline.status === 'error' ? 'bg-[var(--dash-error)]' : 'bg-[var(--dash-text-dim)]'}"></span>
			<span class="text-[11px] font-medium text-[var(--dash-text-dim)]">
				{pipeline.id}
			</span>
			<span class="text-[11px] text-[var(--dash-text-dim)]/60">
				{pipeline.nodes.length} node{pipeline.nodes.length !== 1 ? 's' : ''}
			</span>
		</div>
	{/if}
</div>
