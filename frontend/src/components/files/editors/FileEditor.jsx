import PlainTextEditor from "./PlainTextEditor";
import MarkdownEditor from "./MarkdownEditor";

// Registry-based editor selection.
//
// To support a new editable format later (html, json, xml, yaml, java, sql, …)
// register its component here — there is no per-call `if (fileType === …)`
// branching anywhere else in the UI. PlainTextEditor is the safe default for any
// unmapped text type (it stores native UTF-8 text and produces no HTML).
const EDITORS = {
  txt: PlainTextEditor,
  md: MarkdownEditor,
};

const DEFAULT_EDITOR = PlainTextEditor;

/** Whether a file type has a registered editor (drives the "Edit" affordance). */
export function isEditableType(fileType) {
  return Object.prototype.hasOwnProperty.call(
    EDITORS,
    (fileType || "").toLowerCase()
  );
}

export default function FileEditor({ fileType, value, onChange }) {
  const Editor = EDITORS[(fileType || "").toLowerCase()] || DEFAULT_EDITOR;
  return <Editor value={value} onChange={onChange} />;
}
