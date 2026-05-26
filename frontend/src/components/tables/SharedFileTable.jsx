export default function SharedFileTable({
  files,
  previewFile,
  downloadFile
}) {

  if (!files || files.length === 0) {
    return (
      <div className="empty-state">
        No shared files found.
      </div>
    );
  }

  return (

    <div className="table-wrapper">

      <table>

        <thead>

          <tr>
            <th>File Name</th>
            <th>Description</th>
            <th>Shared By</th>
            <th>Permission</th>
            <th>Actions</th>
          </tr>

        </thead>

        <tbody>

          {files.map((file) => (

            <tr key={file.fileId}>

              <td>

                <button
                  type="button"
                  className="file-preview-link"
                  onClick={() => previewFile(file)}
                >
                  {file.fileName ||
                   file.name ||
                   "Unnamed file"}
                </button>

              </td>

              <td>
                {file.description ||
                 "No description"}
              </td>

              <td>
                {file.ownerEmail ||
                 file.sharedBy ||
                 "-"}
              </td>

              <td>
                <span className="status-badge shared">
                  {file.permission || "SHARED"}
               </span>
              </td>

              <td>

                <button
                  className="btn secondary action-btn"
                  onClick={() => downloadFile(file)}
                >
                  Download
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}