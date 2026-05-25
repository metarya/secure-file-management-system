export default function FileTable({ files, downloadFile, deleteFile, toggleVisibility }) {
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
            <th>ID</th>
            <th>File Name</th>
            <th>Type</th>
            <th>Original Size</th>
            <th>Compressed Size</th>
            <th>Compressed</th>
            <th>Visibility</th>
            <th>Uploaded At</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {files.map((file) => (
            <tr key={file.fileId}>
              <td>{file.fileId}</td>
              <td>{file.fileName}</td>
              <td>{file.fileType}</td>
              <td>{file.originalFileSize ?? file.fileSize ?? "-"}</td>
              <td>{file.compressedFileSize ?? "-"}</td>
              <td>{file.compressed ? "Yes" : "No"}</td>
              <td>
                <span className={`status-badge ${file.visibility === "PUBLIC" ? "public" : "private"}`}>
                  {file.visibility}
                </span>
              </td>
              <td>{file.uploadedAt || "-"}</td>
              <td>
                <button
                  className="btn secondary action-btn"
                  onClick={() => downloadFile(file.fileId)}
                >
                  Download
                </button>
                <button
                  className="btn secondary action-btn"
                  onClick={() => toggleVisibility(file)}
                >
                  Make {file.visibility === "PUBLIC" ? "PRIVATE" : "PUBLIC"}
                </button>
                <button
                  className="btn danger action-btn"
                  onClick={() => deleteFile(file.fileId)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}