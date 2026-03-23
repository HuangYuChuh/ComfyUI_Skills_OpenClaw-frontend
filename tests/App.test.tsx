import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  listServersMock,
  addServerMock,
  updateServerMock,
  toggleServerMock,
  deleteServerMock,
  listWorkflowsMock,
  getWorkflowDetailMock,
  saveWorkflowMock,
  toggleWorkflowMock,
  deleteWorkflowMock,
  batchDeleteWorkflowsMock,
  reorderWorkflowsMock,
  runWorkflowMock,
  listWorkflowHistoryMock,
  getWorkflowHistoryEntryMock,
  deleteWorkflowHistoryEntryMock,
  clearWorkflowHistoryMock,
  previewWorkflowsFromComfyUIMock,
  importWorkflowsFromComfyUIMock,
  importLocalWorkflowsMock,
  previewTransferExportMock,
  buildTransferExportMock,
  previewTransferImportMock,
  importTransferBundleMock,
} = vi.hoisted(() => ({
  listServersMock: vi.fn(),
  addServerMock: vi.fn(),
  updateServerMock: vi.fn(),
  toggleServerMock: vi.fn(),
  deleteServerMock: vi.fn(),
  listWorkflowsMock: vi.fn(),
  getWorkflowDetailMock: vi.fn(),
  saveWorkflowMock: vi.fn(),
  toggleWorkflowMock: vi.fn(),
  deleteWorkflowMock: vi.fn(),
  batchDeleteWorkflowsMock: vi.fn(),
  reorderWorkflowsMock: vi.fn(),
  runWorkflowMock: vi.fn(),
  listWorkflowHistoryMock: vi.fn(),
  getWorkflowHistoryEntryMock: vi.fn(),
  deleteWorkflowHistoryEntryMock: vi.fn(),
  clearWorkflowHistoryMock: vi.fn(),
  previewWorkflowsFromComfyUIMock: vi.fn(),
  importWorkflowsFromComfyUIMock: vi.fn(),
  importLocalWorkflowsMock: vi.fn(),
  previewTransferExportMock: vi.fn(),
  buildTransferExportMock: vi.fn(),
  previewTransferImportMock: vi.fn(),
  importTransferBundleMock: vi.fn(),
}));

vi.mock('../src/services/servers', () => ({
  listServers: listServersMock,
  addServer: addServerMock,
  updateServer: updateServerMock,
  toggleServer: toggleServerMock,
  deleteServer: deleteServerMock,
  getServerStatus: vi.fn().mockResolvedValue({ server_id: 'local', status: 'online', url: 'http://127.0.0.1:8188' }),
  testServerConnection: vi.fn().mockResolvedValue({ status: 'online' }),
}));

vi.mock('../src/services/workflows', () => ({
  listWorkflows: listWorkflowsMock,
  getWorkflowDetail: getWorkflowDetailMock,
  saveWorkflow: saveWorkflowMock,
  toggleWorkflow: toggleWorkflowMock,
  deleteWorkflow: deleteWorkflowMock,
  batchDeleteWorkflows: batchDeleteWorkflowsMock,
  reorderWorkflows: reorderWorkflowsMock,
  runWorkflow: runWorkflowMock,
  listWorkflowHistory: listWorkflowHistoryMock,
  getWorkflowHistoryEntry: getWorkflowHistoryEntryMock,
  deleteWorkflowHistoryEntry: deleteWorkflowHistoryEntryMock,
  clearWorkflowHistory: clearWorkflowHistoryMock,
  previewWorkflowsFromComfyUI: previewWorkflowsFromComfyUIMock,
  importWorkflowsFromComfyUI: importWorkflowsFromComfyUIMock,
  importLocalWorkflows: importLocalWorkflowsMock,
}));

vi.mock('../src/services/transfer', () => ({
  previewTransferExport: previewTransferExportMock,
  buildTransferExport: buildTransferExportMock,
  previewTransferImport: previewTransferImportMock,
  importTransferBundle: importTransferBundleMock,
}));

vi.mock('../src/lib/pixelBlastBackground', () => ({
  initPixelBlastBackground: vi.fn(() => undefined),
}));

import App from '../src/App';

const serverFixture = {
  id: 'local',
  name: 'Local',
  url: 'http://127.0.0.1:8188',
  enabled: true,
  output_dir: './outputs',
};

const remoteServerFixture = {
  id: 'remote',
  name: 'Remote',
  url: 'http://10.0.0.1:8188',
  enabled: true,
  output_dir: './outputs',
};

const unsupportedServerFixture = {
  id: 'legacy-remote-v2',
  name: 'Legacy Remote',
  url: 'http://legacy-remote.invalid:8188',
  enabled: true,
  output_dir: './outputs',
  server_type: 'legacy_remote_v2',
  unsupported: true,
  unsupported_reason: 'Server type "legacy_remote_v2" is not supported in this branch.',
};

const workflowFixture = {
  id: 'wf-a',
  server_id: 'local',
  server_name: 'Local',
  enabled: true,
  description: 'First workflow',
  updated_at: 10,
};

const workflowFixtureWithHistory = {
  ...workflowFixture,
  has_history: true,
};

const workflowApiJson = JSON.stringify({
  '1': {
    class_type: 'CLIPTextEncode',
    inputs: {
      text: 'hello world',
    },
  },
});

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function createHistoryDetail(overrides: Partial<{
  run_id: string;
  server_id: string;
  workflow_id: string;
  status: string;
  created_at: string;
  raw_args: Record<string, unknown>;
  resolved_args: Record<string, unknown>;
  result: { images: string[]; image_count: number };
  error: null;
}> = {}) {
  return {
    run_id: 'run-1',
    server_id: workflowFixture.server_id,
    workflow_id: workflowFixture.id,
    status: 'success',
    created_at: '2026-03-20T00:00:00Z',
    raw_args: {},
    resolved_args: {},
    result: { images: [], image_count: 0 },
    error: null,
    ...overrides,
  };
}

const exportPreviewFixture = {
  portable_only: false,
  summary: {
    servers: 1,
    workflows: 1,
    warnings: 0,
  },
  servers: [
    {
      server_id: 'local',
      name: 'Local',
      enabled: true,
      selected: true,
      workflow_count: 1,
      workflows: [
        {
          workflow_id: 'wf-a',
          enabled: true,
          description: 'First workflow',
          selected: true,
        },
      ],
    },
  ],
  warnings: [],
};

const importPreviewFixture = {
  validation: {
    valid: true,
    errors: [],
    warnings: [],
  },
  plan: {
    created_servers: [{ server_id: 'remote', reason: 'create_server' }],
    updated_servers: [],
    created_workflows: [{ server_id: 'remote', workflow_id: 'wf-b', reason: 'create_workflow' }],
    overwritten_workflows: [],
    skipped_items: [],
    warnings: [],
    apply_environment: false,
    overwrite_workflows: true,
    summary: {
      created_servers: 1,
      updated_servers: 0,
      created_workflows: 1,
      overwritten_workflows: 0,
      skipped_items: 0,
      warnings: 0,
    },
  },
};

const importPreviewFixtureLatest = {
  validation: {
    valid: true,
    errors: [],
    warnings: [],
  },
  plan: {
    created_servers: [{ server_id: 'remote-latest', reason: 'create_server' }],
    updated_servers: [],
    created_workflows: [{ server_id: 'remote-latest', workflow_id: 'wf-latest', reason: 'create_workflow' }],
    overwritten_workflows: [],
    skipped_items: [],
    warnings: [],
    apply_environment: false,
    overwrite_workflows: true,
    summary: {
      created_servers: 1,
      updated_servers: 0,
      created_workflows: 1,
      overwritten_workflows: 0,
      skipped_items: 0,
      warnings: 0,
    },
  },
};

const bulkImportReportFixture = {
  summary: {
    created: 1,
    renamed: 1,
    skipped: 0,
    failed: 1,
    total: 3,
  },
  items: [
    {
      workflow_id: 'portrait',
      final_workflow_id: 'portrait',
      source_label: 'portrait.json',
      status: 'created' as const,
      reason: '',
    },
    {
      workflow_id: 'portrait',
      final_workflow_id: 'portrait-2',
      source_label: 'workflows/portrait.json',
      status: 'renamed' as const,
      reason: '',
    },
    {
      workflow_id: '',
      final_workflow_id: '',
      source_label: 'broken.json',
      status: 'failed' as const,
      reason: 'Invalid JSON file.',
    },
  ],
};

const bulkImportPreviewFixture = {
  summary: {
    ready: 1,
    renamed: 1,
    failed: 1,
    importable: 2,
    total: 3,
  },
  items: [
    {
      workflow_id: 'portrait',
      final_workflow_id: 'portrait',
      source_label: 'workflows/portrait.json',
      description: 'Portrait workflow',
      status: 'ready' as const,
      reason: '',
    },
    {
      workflow_id: 'portrait',
      final_workflow_id: 'portrait-2',
      source_label: 'workflows/portrait-copy.json',
      description: 'Portrait workflow copy',
      status: 'renamed' as const,
      reason: '',
    },
    {
      workflow_id: '',
      final_workflow_id: '',
      source_label: 'broken.json',
      description: '',
      status: 'failed' as const,
      reason: 'Invalid JSON file.',
    },
  ],
};

async function uploadWorkflowFile(fileName = 'workflow_api.json', content = workflowApiJson) {
  const fileInput = document.getElementById('file-upload') as HTMLInputElement;
  const file = new File([content], fileName, { type: 'application/json' });
  Object.defineProperty(file, 'text', {
    value: async () => content,
  });
  const user = userEvent.setup();
  await user.upload(fileInput, file);
}

async function openCreateWorkflowPage() {
  const user = userEvent.setup();
  render(<App />);

  await screen.findByRole('button', { name: '+ New Workflow' });
  await user.click(screen.getByRole('button', { name: '+ New Workflow' }));
  await screen.findByText('Choose a workflow import method');

  return user;
}

async function enterEditorWithUploadedWorkflow() {
  const user = await openCreateWorkflowPage();
  await uploadWorkflowFile();
  await screen.findByLabelText(/Workflow ID/i);
  await user.clear(screen.getByLabelText(/Workflow ID/i));
  await user.type(screen.getByLabelText(/Workflow ID/i), 'wf-basic');
  await screen.findByRole('button', { name: 'Save Workflow and Mapping Schema' });

  return user;
}

async function startComfyUiImportFromEditor() {
  const user = await openCreateWorkflowPage();

  await user.click(screen.getByRole('button', { name: 'Scan Workflows' }));

  const confirmDialog = await screen.findByRole('dialog');
  expect(within(confirmDialog).getByText('Review workflows from current server')).toBeInTheDocument();

  await user.click(within(confirmDialog).getByRole('button', { name: 'Import All' }));

  return user;
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.location.hash = '#/';
    window.scrollTo = vi.fn();

    listServersMock.mockResolvedValue({
      servers: [serverFixture],
      default_server: serverFixture.id,
    });
    addServerMock.mockResolvedValue({ status: 'ok', server: serverFixture });
    updateServerMock.mockResolvedValue({ status: 'ok', server: serverFixture });
    toggleServerMock.mockResolvedValue({ status: 'ok', enabled: true });
    deleteServerMock.mockResolvedValue({ status: 'ok' });
    listWorkflowsMock.mockResolvedValue({ workflows: [workflowFixture] });
    getWorkflowDetailMock.mockResolvedValue({
      workflow_id: workflowFixture.id,
      server_id: workflowFixture.server_id,
      description: workflowFixture.description,
      enabled: workflowFixture.enabled,
      workflow_data: JSON.parse(workflowApiJson),
      schema_params: {},
    });
    saveWorkflowMock.mockResolvedValue({ status: 'ok', workflow_id: 'wf-basic' });
    toggleWorkflowMock.mockResolvedValue({ status: 'ok', enabled: true });
    deleteWorkflowMock.mockResolvedValue({ status: 'ok' });
    batchDeleteWorkflowsMock.mockResolvedValue({ status: 'success', deleted: ['wf-a'], missing: [] });
    reorderWorkflowsMock.mockResolvedValue({ status: 'ok', workflow_order: [] });
    runWorkflowMock.mockResolvedValue({ status: 'ok', result: { images: [] } });
    listWorkflowHistoryMock.mockResolvedValue({ history: [] });
    getWorkflowHistoryEntryMock.mockResolvedValue(createHistoryDetail());
    deleteWorkflowHistoryEntryMock.mockResolvedValue({ status: 'ok' });
    clearWorkflowHistoryMock.mockResolvedValue({ status: 'ok', deleted: 0 });
    previewWorkflowsFromComfyUIMock.mockResolvedValue({ status: 'success', preview: bulkImportPreviewFixture });
    importWorkflowsFromComfyUIMock.mockResolvedValue({ status: 'success', report: bulkImportReportFixture });
    importLocalWorkflowsMock.mockResolvedValue({ status: 'success', report: bulkImportReportFixture });
    previewTransferExportMock.mockResolvedValue(exportPreviewFixture);
    buildTransferExportMock.mockResolvedValue({ bundle: { ok: true }, preview: exportPreviewFixture });
    previewTransferImportMock.mockResolvedValue(importPreviewFixture);
    importTransferBundleMock.mockResolvedValue({
      status: 'success',
      validation: importPreviewFixture.validation,
      plan: importPreviewFixture.plan,
    });
    Object.defineProperty(window.URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: vi.fn(() => 'blob:mock'),
    });
    Object.defineProperty(window.URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: vi.fn(),
    });
  });

  it('saves with Ctrl/Cmd+S while editing when no modal is open', async () => {
    await enterEditorWithUploadedWorkflow();

    fireEvent.keyDown(document, { key: 's', ctrlKey: true });

    await waitFor(() => {
      expect(saveWorkflowMock).toHaveBeenCalledTimes(1);
    });
  });

  it('does not save with Ctrl/Cmd+S while a confirm modal is open', async () => {
    const user = await enterEditorWithUploadedWorkflow();

    await user.click(screen.getByRole('button', { name: 'Back' }));
    await screen.findByText('You have unsaved changes in the editor. Leave anyway?');

    fireEvent.keyDown(document, { key: 's', ctrlKey: true });

    await waitFor(() => {
      expect(saveWorkflowMock).not.toHaveBeenCalled();
    });
  });

  it('switches from upload zone to mapping section after a workflow file is uploaded', async () => {
    await openCreateWorkflowPage();

    expect(screen.getByText('Choose a workflow import method')).toBeInTheDocument();
    expect(document.getElementById('mapping-section')).toHaveClass('hidden');

    await uploadWorkflowFile();

    await screen.findByLabelText(/Workflow ID/i);
    await screen.findByRole('button', { name: 'Save Workflow and Mapping Schema' });
    expect(screen.queryByText('Choose a workflow import method')).not.toBeInTheDocument();
    expect(document.getElementById('mapping-section')).not.toHaveClass('hidden');
  });

  it('opens the editor when a workflow file is dropped onto the empty workflow state', async () => {
    const user = userEvent.setup();
    listWorkflowsMock.mockResolvedValue({ workflows: [] });
    render(<App />);

    await screen.findByText('Choose a workflow import method');
    const dropzone = screen.getByText('Choose a workflow import method').closest('label') as HTMLElement;
    const file = new File([workflowApiJson], 'workflow_api.json', { type: 'application/json' });
    Object.defineProperty(file, 'text', {
      value: async () => workflowApiJson,
    });

    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [file],
      },
    });

    await screen.findByRole('button', { name: 'Save Workflow and Mapping Schema' });
    expect(screen.getByDisplayValue('workflow_api')).toBeInTheDocument();
    expect(screen.queryByText('No workflow mappings configured yet.')).not.toBeInTheDocument();
  });

  it('opens workflow actions and triggers upload new version', async () => {
    const user = userEvent.setup();
    render(<App />);

    const trigger = await screen.findByRole('button', { name: 'More actions for workflow wf-a' });
    await user.click(trigger);

    const menu = trigger.closest('.workflow-more');
    const uploadItem = within(menu as HTMLElement).getByRole('menuitem', { name: 'Upload New Version' });
    await user.click(uploadItem);

    expect(getWorkflowDetailMock).toHaveBeenCalledWith('local', 'wf-a');
  });

  it('does not render the history shortcut in the workflow list', async () => {
    listWorkflowsMock.mockResolvedValue({ workflows: [workflowFixtureWithHistory] });
    render(<App />);

    await screen.findByText('wf-a');

    expect(screen.queryByRole('button', { name: 'History' })).not.toBeInTheDocument();
  });

  it('batch deletes the selected workflows from the current server', async () => {
    const user = userEvent.setup();
    const workflowB = {
      ...workflowFixture,
      id: 'wf-b',
      description: 'Second workflow',
      updated_at: 20,
    };
    listWorkflowsMock
      .mockResolvedValueOnce({ workflows: [workflowFixture, workflowB] })
      .mockResolvedValueOnce({ workflows: [workflowB] });

    render(<App />);

    await screen.findByText('wf-a');
    await user.click(screen.getByRole('checkbox', { name: 'Select workflow wf-a' }));
    await user.click(screen.getByRole('button', { name: 'Delete selected' }));

    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Delete selected' }));

    await waitFor(() => {
      expect(batchDeleteWorkflowsMock).toHaveBeenCalledWith('local', { workflow_ids: ['wf-a'] });
    });
    expect(await screen.findByText('Deleted 1 workflows.')).toBeInTheDocument();
  });

  it('submits a new server using the plain ComfyUI payload shape', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByRole('button', { name: 'Add Server' });
    await user.click(screen.getByRole('button', { name: 'Add Server' }));

    await user.type(screen.getByLabelText('Server ID'), 'remote');
    await user.type(screen.getByLabelText('Server Name'), 'Remote');

    const urlInput = screen.getByLabelText('Server URL');
    fireEvent.change(urlInput, { target: { value: 'http://10.0.0.1:8188' } });

    await user.click(screen.getByRole('button', { name: 'Save and Connect' }));

    await waitFor(() => {
      expect(addServerMock).toHaveBeenCalledWith({
        id: 'remote',
        name: 'Remote',
        url: 'http://10.0.0.1:8188',
        auth: '',
        enabled: true,
        output_dir: './outputs',
      });
    });
  });

  it('warns when legacy unsupported servers are loaded and blocks creating workflows on them', async () => {
    const user = userEvent.setup();
    listServersMock.mockResolvedValue({
      servers: [unsupportedServerFixture],
      default_server: unsupportedServerFixture.id,
    });
    listWorkflowsMock.mockResolvedValue({ workflows: [] });

    render(<App />);

    expect((await screen.findAllByText(/Server type "legacy_remote_v2" is not supported in this branch/)).length).toBeGreaterThan(0);
    expect(screen.getByText('Legacy Remote (Unsupported)')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '+ New Workflow' }));

    expect(screen.getAllByText(/Server type "legacy_remote_v2" is not supported in this branch/).length).toBeGreaterThan(0);
  });

  it('falls back to another server after deleting the currently selected one', async () => {
    const user = userEvent.setup();
    listServersMock
      .mockResolvedValueOnce({
        servers: [serverFixture, remoteServerFixture],
        default_server: serverFixture.id,
      })
      .mockResolvedValueOnce({
        servers: [remoteServerFixture],
        default_server: remoteServerFixture.id,
      });
    listWorkflowsMock.mockResolvedValue({ workflows: [] });

    render(<App />);

    await screen.findByText('Local');
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await screen.findByText('Delete server local? Data files will NOT be removed.');

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    await user.click(deleteButtons[deleteButtons.length - 1]);

    await waitFor(() => {
      expect(deleteServerMock).toHaveBeenCalledWith('local', false);
    });

    await waitFor(() => {
      expect(screen.getByText('Remote')).toBeInTheDocument();
      expect(screen.queryByText('Local')).not.toBeInTheDocument();
    });
  });

  it('edits the visible fallback server instead of a stale deleted server id', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem('ui-server', 'cloud');
    listServersMock.mockResolvedValue({
      servers: [serverFixture],
      default_server: serverFixture.id,
    });
    listWorkflowsMock.mockResolvedValue({ workflows: [] });

    render(<App />);

    await screen.findByText('Local');
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    await screen.findByDisplayValue('Local');

    const nameInput = screen.getByLabelText('Server Name');
    await user.clear(nameInput);
    await user.type(nameInput, 'Local Updated');
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(updateServerMock).toHaveBeenCalledWith('local', {
        id: 'local',
        name: 'Local Updated',
        url: 'http://127.0.0.1:8188',
        auth: '',
        enabled: true,
        output_dir: './outputs',
      });
    });
  });

  it('restores export config entry in the main shell and downloads a selected bundle', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: 'Export Config' }));
    const dialog = await screen.findByRole('dialog');
    await within(dialog).findByRole('button', { name: 'Download Bundle' });
    await within(dialog).findByText('wf-a');

    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    await user.click(screen.getByRole('button', { name: 'Download Bundle' }));

    await waitFor(() => {
      expect(buildTransferExportMock).toHaveBeenCalledWith({
        servers: [{ server_id: 'local', workflow_ids: ['wf-a'] }],
      });
    });

    anchorClick.mockRestore();
  });

  it('shows export-specific copy when export preview fails', async () => {
    const user = userEvent.setup();
    previewTransferExportMock.mockRejectedValueOnce(new Error(''));
    render(<App />);

    await user.click(await screen.findByRole('button', { name: 'Export Config' }));

    expect(await screen.findByText('Failed to preview the export bundle.')).toBeInTheDocument();
  });

  it('keeps the transfer dialog open while an export bundle is loading', async () => {
    const user = userEvent.setup();
    const exportDeferred = createDeferred<{ bundle: { ok: boolean }; preview: typeof exportPreviewFixture }>();
    buildTransferExportMock.mockReturnValue(exportDeferred.promise);
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    render(<App />);

    await user.click(await screen.findByRole('button', { name: 'Export Config' }));
    const dialog = await screen.findByRole('dialog');
    const cancelButton = within(dialog).getByRole('button', { name: 'Cancel' });
    await user.click(within(dialog).getByRole('button', { name: 'Download Bundle' }));

    await waitFor(() => {
      expect(cancelButton).toBeDisabled();
    });

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(cancelButton);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    exportDeferred.resolve({ bundle: { ok: true }, preview: exportPreviewFixture });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    anchorClick.mockRestore();
  });

  it('shows export-specific copy when export bundle build fails', async () => {
    const user = userEvent.setup();
    buildTransferExportMock.mockRejectedValueOnce(new Error(''));
    render(<App />);

    await user.click(await screen.findByRole('button', { name: 'Export Config' }));
    await screen.findByRole('dialog');
    await user.click(screen.getByRole('button', { name: 'Download Bundle' }));

    expect(await screen.findByText('Failed to build the export bundle.')).toBeInTheDocument();
  });

  it('restores import config entry in the main shell and imports a selected bundle', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByRole('button', { name: 'Import Config' });

    const bundleFile = new File([JSON.stringify({ bundle_type: 'openclaw-comfyui-skill' })], 'openclaw-skill-export.json', {
      type: 'application/json',
    });
    Object.defineProperty(bundleFile, 'text', {
      value: async () => JSON.stringify({ bundle_type: 'openclaw-comfyui-skill' }),
    });

    const importInput = document.getElementById('transfer-import-file') as HTMLInputElement;
    await user.upload(importInput, bundleFile);
    await screen.findByRole('button', { name: 'Import Bundle' });
    await user.click(screen.getByRole('button', { name: 'Import Bundle' }));

    await waitFor(() => {
      expect(importTransferBundleMock).toHaveBeenCalledWith({ bundle_type: 'openclaw-comfyui-skill' }, false, true);
    });
  });

  it('keeps the latest import preview when bundle previews resolve out of order', async () => {
    const user = userEvent.setup();
    const firstPreview = createDeferred<typeof importPreviewFixture>();
    const secondPreview = createDeferred<typeof importPreviewFixtureLatest>();
    previewTransferImportMock.mockReturnValueOnce(firstPreview.promise).mockReturnValueOnce(secondPreview.promise);
    render(<App />);

    await screen.findByRole('button', { name: 'Import Config' });

    const firstBundleContent = JSON.stringify({ bundle_type: 'openclaw-comfyui-skill', bundle_id: 'first' });
    const secondBundleContent = JSON.stringify({ bundle_type: 'openclaw-comfyui-skill', bundle_id: 'second' });
    const firstBundle = new File([firstBundleContent], 'first.json', { type: 'application/json' });
    const secondBundle = new File([secondBundleContent], 'second.json', { type: 'application/json' });

    Object.defineProperty(firstBundle, 'text', {
      value: async () => firstBundleContent,
    });
    Object.defineProperty(secondBundle, 'text', {
      value: async () => secondBundleContent,
    });

    const importInput = document.getElementById('transfer-import-file') as HTMLInputElement;
    await user.upload(importInput, firstBundle);
    await user.upload(importInput, secondBundle);

    secondPreview.resolve(importPreviewFixtureLatest);

    await waitFor(() => {
      expect(screen.getByText('remote-latest/wf-latest')).toBeInTheDocument();
    });

    firstPreview.resolve(importPreviewFixture);

    await waitFor(() => {
      expect(screen.getByText('remote-latest/wf-latest')).toBeInTheDocument();
      expect(screen.queryByText('remote/wf-b')).not.toBeInTheDocument();
    });
  });

  it('imports all saved workflows from ComfyUI and shows the result report', async () => {
    await startComfyUiImportFromEditor();

    await waitFor(() => {
      expect(importWorkflowsFromComfyUIMock).toHaveBeenCalledWith('local');
    });

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('ComfyUI Import Report')).toBeInTheDocument();
    expect(within(dialog).getByText('portrait.json')).toBeInTheDocument();
    expect(within(dialog).getByText('workflows/portrait.json')).toBeInTheDocument();
    expect(within(dialog).getByText('broken.json')).toBeInTheDocument();
  });

  it('still shows the import report when refreshing workflows fails after a successful import', async () => {
    listWorkflowsMock.mockResolvedValueOnce({ workflows: [workflowFixture] }).mockRejectedValueOnce(new Error('Failed to load workflow list.'));
    await startComfyUiImportFromEditor();

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('ComfyUI Import Report')).toBeInTheDocument();
    expect(await screen.findByText('Failed to load workflow list.')).toBeInTheDocument();
  });

  it('imports local workflow files and sends file contents to the batch import API', async () => {
    const user = userEvent.setup();
    render(<App />);

    const localImportInput = document.getElementById('bulk-import-files') as HTMLInputElement;
    const apiWorkflow = new File([workflowApiJson], 'workflow_api.json', { type: 'application/json' });
    const editorWorkflowContent = JSON.stringify({
      nodes: [{ id: 1, type: 'CLIPTextEncode', inputs: [], widgets_values: ['hello'] }],
      links: [],
    });
    const editorWorkflow = new File([editorWorkflowContent], 'editor.json', { type: 'application/json' });
    Object.defineProperty(apiWorkflow, 'text', { value: async () => workflowApiJson });
    Object.defineProperty(editorWorkflow, 'text', { value: async () => editorWorkflowContent });
    Object.defineProperty(editorWorkflow, 'webkitRelativePath', { value: 'folder/editor.json' });

    await user.upload(localImportInput, [apiWorkflow, editorWorkflow]);

    await waitFor(() => {
      expect(importLocalWorkflowsMock).toHaveBeenCalledWith('local', [
        {
          file_name: 'workflow_api.json',
          content: workflowApiJson,
        },
        {
          file_name: 'folder/editor.json',
          content: editorWorkflowContent,
        },
      ]);
    });

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Local Import Report')).toBeInTheDocument();
  });

  it('disables import actions while a ComfyUI import is still running', async () => {
    const deferredImport = createDeferred<typeof bulkImportReportFixture>();
    importWorkflowsFromComfyUIMock.mockReturnValueOnce(deferredImport.promise.then((report) => ({ status: 'success', report })));
    await startComfyUiImportFromEditor();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Importing...' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Choose Folder' })).toBeDisabled();
    });

    deferredImport.resolve(bulkImportReportFixture);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Scan Workflows' })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: 'Choose Folder' })).not.toBeDisabled();
    });
  });

  it('ignores stale run workflow detail responses after switching to another workflow', async () => {
    const user = userEvent.setup();
    const workflowB = {
      ...workflowFixture,
      id: 'wf-b',
      description: 'Second workflow',
      updated_at: 20,
    };
    const firstDetail = createDeferred<unknown>();
    const secondDetail = createDeferred<unknown>();
    listWorkflowsMock.mockResolvedValue({ workflows: [workflowFixture, workflowB] });
    getWorkflowDetailMock.mockImplementation((_serverId: string, workflowId: string) => {
      if (workflowId === workflowFixture.id) {
        return firstDetail.promise;
      }
      return secondDetail.promise;
    });

    render(<App />);

    const initialRunButtons = await screen.findAllByRole('button', { name: 'Run' });
    await user.click(initialRunButtons[0]);
    await screen.findByRole('dialog');
    await user.click(screen.getByRole('button', { name: 'Close' }));

    const runButtons = await screen.findAllByRole('button', { name: 'Run' });
    await user.click(runButtons[1]);

    secondDetail.resolve({
      workflow_id: workflowB.id,
      server_id: workflowB.server_id,
      description: workflowB.description,
      enabled: workflowB.enabled,
      workflow_data: JSON.parse(workflowApiJson),
      schema_params: {},
      run_schema_params: {
        prompt_b: {
          type: 'string',
          default: 'second prompt',
        },
      },
    });

    await screen.findByText('Run workflow wf-b');
    await screen.findByLabelText('prompt_b');

    firstDetail.resolve({
      workflow_id: workflowFixture.id,
      server_id: workflowFixture.server_id,
      description: workflowFixture.description,
      enabled: workflowFixture.enabled,
      workflow_data: JSON.parse(workflowApiJson),
      schema_params: {},
      run_schema_params: {
        prompt_a: {
          type: 'string',
          default: 'first prompt',
        },
      },
    });

    await waitFor(() => {
      expect(screen.getByText('Run workflow wf-b')).toBeInTheDocument();
      expect(screen.getByLabelText('prompt_b')).toBeInTheDocument();
      expect(screen.queryByLabelText('prompt_a')).not.toBeInTheDocument();
    });
  });

});
