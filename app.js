const DEPTH_COLORS = {
  0: '#4f9cf9',
  1: '#7b68ee',
  2: '#a78bfa',
  3: '#f472b6',
};

const STATUS_LABELS = {
  none:           '—',
  merged:         'Merged',
  pr:             'PR Open',
  'in-progress':  'In Progress',
};

const STATUS_COLORS = {
  merged:        '#22c55e',
  pr:            '#f59e0b',
  'in-progress': '#60a5fa',
};

// Inject depth-based color into each node before passing to Cytoscape
const elements = {
  nodes: COMPONENT_NODES.map(n => ({
    data: { ...n.data, color: DEPTH_COLORS[n.data.depth] ?? '#4f9cf9' },
  })),
  edges: COMPONENT_EDGES,
};

cytoscape.use(cytoscapeDagre);

const cy = cytoscape({
  container: document.getElementById('cy'),
  elements,
  style: [
    {
      selector: 'node',
      style: {
        'background-color': 'data(color)',
        'label': 'data(label)',
        'color': '#fff',
        'font-size': '11px',
        'font-family': '-apple-system, BlinkMacSystemFont, Inter, sans-serif',
        'font-weight': '600',
        'text-valign': 'center',
        'text-halign': 'center',
        'width': 'label',
        'height': 32,
        'padding': '10px',
        'shape': 'round-rectangle',
        'border-width': 0,
        'text-max-width': '120px',
        'text-wrap': 'wrap',
        'transition-property': 'opacity, border-color, border-width',
        'transition-duration': '150ms',
      },
    },
    // Status borders — edit `status` in data.js to activate these
    {
      selector: 'node[status = "merged"]',
      style: { 'border-width': 3, 'border-color': '#22c55e' },
    },
    {
      selector: 'node[status = "pr"]',
      style: { 'border-width': 3, 'border-color': '#f59e0b' },
    },
    {
      selector: 'node[status = "in-progress"]',
      style: { 'border-width': 3, 'border-color': '#60a5fa' },
    },
    {
      selector: 'node.dimmed',
      style: { opacity: 0.15 },
    },
    {
      selector: 'edge',
      style: {
        'width': 1.5,
        'line-color': '#2d3a52',
        'target-arrow-color': '#2d3a52',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'arrow-scale': 0.8,
        'opacity': 0.7,
        'transition-property': 'opacity, line-color, target-arrow-color',
        'transition-duration': '150ms',
      },
    },
    {
      selector: 'edge.highlighted',
      style: {
        'line-color': '#7b68ee',
        'target-arrow-color': '#7b68ee',
        'opacity': 1,
        'width': 2,
      },
    },
    {
      selector: 'edge.dimmed',
      style: { opacity: 0.05 },
    },
  ],
  layout: {
    name: 'dagre',
    rankDir: 'TB',
    rankSep: 60,
    nodeSep: 40,
    edgeSep: 10,
    padding: 32,
    animate: false,
  },
  wheelSensitivity: 0.3,
});

// ── Hover highlight + tooltip ─────────────────────────────────────────────────
const tooltip = document.getElementById('tooltip');

cy.on('mouseover', 'node', e => {
  const node = e.target;
  const neighborhood = node.neighborhood().add(node);
  cy.nodes().not(neighborhood).addClass('dimmed');
  cy.edges().addClass('dimmed');
  node.connectedEdges().removeClass('dimmed').addClass('highlighted');

  const status     = node.data('status') || 'none';
  const statusColor = STATUS_COLORS[status] || '#64748b';
  const deps       = node.outgoers('node').map(n => n.data('label')).sort();
  const dependents = node.incomers('node').map(n => n.data('label')).sort();

  tooltip.innerHTML = `
    <strong>${node.data('id')}</strong>
    <div class="meta">Depth: ${node.data('depth')}</div>
    <div class="meta" style="color:${statusColor}">Status: ${STATUS_LABELS[status]}</div>
    ${deps.length      ? `<div class="meta" style="margin-top:6px">Uses: ${deps.join(', ')}</div>` : ''}
    ${dependents.length ? `<div class="meta">Used by: ${dependents.join(', ')}</div>` : ''}
  `;
  tooltip.style.display = 'block';
});

cy.on('mousemove', e => {
  tooltip.style.left = (e.originalEvent.clientX + 14) + 'px';
  tooltip.style.top  = (e.originalEvent.clientY + 14) + 'px';
});

cy.on('mouseout', 'node', () => {
  cy.nodes().removeClass('dimmed');
  cy.edges().removeClass('dimmed').removeClass('highlighted');
  tooltip.style.display = 'none';
});

cy.fit(null, 32);
