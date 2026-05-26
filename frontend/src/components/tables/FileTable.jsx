export default function FileTable({
  files,
  downloadFile,
  deleteFile,
  toggleVisibility,
  previewFile
}) {

  if (!files || files.length === 0) {
    return (
      <div className="empty-state">
        No files found. Click Refresh after uploading files.
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
            <th>Visibility</th>
            <th>Uploaded At</th>
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
                  title="Click to preview file"
                >
                  {file.fileName ||
                   file.name ||
                   "Unnamed file"}
                </button>

              </td>

              <td>
                {file.sharedFile?.description ||
                 file.description ||
                 "-"}
              </td>

              <td>

                <span
                  className={`status-badge ${
                    file.sharedAt
                      ? "shared"
                      : file.visibility === "PUBLIC"
                      ? "public"
                      : "private"
                  }`}
                >

                  {file.sharedAt
                    ? "SHARED"
                    : file.visibility}

                </span>

              </td>

              <td>
                {file.uploadedAt || "-"}
              </td>

              <td>

                <button
                  className="btn secondary action-btn"
                  onClick={() => downloadFile(file)}
                >
                  Download
                </button>

                {!file.sharedAt && (
                  <button
                    className="btn secondary action-btn"
                    onClick={() => toggleVisibility(file)}
                  >
                    Make {file.visibility === "PUBLIC"
                      ? "PRIVATE"
                      : "PUBLIC"}
                  </button>
                )}

                <button
                  className="btn danger action-btn"
                  onClick={() => deleteFile(file)}
                >
                  {file.sharedAt
                    ? "Remove"
                    : "Delete"}
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}