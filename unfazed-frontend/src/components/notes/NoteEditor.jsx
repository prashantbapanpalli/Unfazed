import { useEffect, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { LockedHint } from '../common/UpgradePrompt'

const TEMPLATES = {
  free: '',
  soap: '<h3>Subjective</h3><p></p><h3>Objective</h3><p></p><h3>Assessment</h3><p></p><h3>Plan</h3><p></p>',
  dap: '<h3>Data</h3><p></p><h3>Assessment</h3><p></p><h3>Plan</h3><p></p>',
}

// Rich text editor. Templates the plan does not include are shown locked (the API enforces it too).
export default function NoteEditor({ initial, ent, onSave, onCancel }) {
  const [template, setTemplate] = useState(initial?.template || 'free')
  const [type, setType] = useState(initial?.type || 'private')
  const [saving, setSaving] = useState(false)
  const editor = useEditor({ extensions: [StarterKit], content: initial?.content || '' })
  useEffect(() => () => editor?.destroy(), [editor])

  const pick = (t) => {
    if (!ent.canTemplate(t)) return
    setTemplate(t)
    if (!initial && editor) editor.commands.setContent(TEMPLATES[t])
  }
  const Btn = ({ on, label, cmd }) => (
    <button type="button" onClick={cmd} className={`rounded px-2 py-1 text-xs ${on ? 'bg-brand-600 text-white' : 'hover:bg-slate-200'}`}>{label}</button>
  )
  const save = async () => {
    setSaving(true)
    try { await onSave({ template, type, content: editor.getHTML() }) } finally { setSaving(false) }
  }
  if (!editor) return null

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {['free', 'soap', 'dap'].map((t) => (
          <button key={t} type="button" disabled={!ent.canTemplate(t)} onClick={() => pick(t)}
            className={`${template === t ? 'btn' : 'btn-ghost'} !py-1 uppercase`}>
            {t}{!ent.canTemplate(t) && ' (locked)'}
          </button>
        ))}
        <select className="input ml-auto w-44" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="private">Private (only me)</option>
          <option value="shared">Shared with client</option>
        </select>
      </div>
      {(!ent.canTemplate('soap') || !ent.canTemplate('dap')) && <LockedHint>SOAP and DAP templates are part of a higher plan.</LockedHint>}
      <div>
        <div className="flex gap-1 rounded-t-lg border border-slate-300 bg-slate-50 p-1">
          <Btn label="B" on={editor.isActive('bold')} cmd={() => editor.chain().focus().toggleBold().run()} />
          <Btn label="I" on={editor.isActive('italic')} cmd={() => editor.chain().focus().toggleItalic().run()} />
          <Btn label="List" on={editor.isActive('bulletList')} cmd={() => editor.chain().focus().toggleBulletList().run()} />
        </div>
        <EditorContent editor={editor} />
      </div>
      <div className="flex gap-2"><button className="btn" disabled={saving} onClick={save}>Save note</button><button className="btn-ghost" onClick={onCancel}>Cancel</button></div>
    </div>
  )
}
