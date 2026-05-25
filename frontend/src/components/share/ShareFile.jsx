export default function ShareFile({
  files,
  shareFileId,
  setShareFileId,
  targetUserEmail,
  setTargetUserEmail,
  permissionType,
  setPermissionType,
  shareFileAccess,
  shareMessage
}){
    return(
        <section className="card">
            <h3>Share File Access</h3>

            <label>
            File Name
            <select
                value={shareFileId}
                onChange={(e) => setShareFileId(e.target.value)}
                required
            >
                <option value="">Select file to share</option>
                {files.map((file) => {
                const optionFileId = file.fileId || file.id;

                return (
                    <option key={optionFileId} value={optionFileId}>
                    {file.fileName}
                    </option>
                );
                })}
            </select>
            </label>
            <input
            type="email"
            placeholder="Enter target user email"
            value={targetUserEmail}
            onChange={(e) => setTargetUserEmail(e.target.value)}
            />

            <label>Permission Type</label>
            <select
            value={permissionType}
                onChange={(e) => setPermissionType(e.target.value)}
            >
            <option value="VIEW">View Only</option>
                <option value="DOWNLOAD">View + Download</option>
            </select>

            <button className="btn primary" onClick={shareFileAccess}>
                Share File
            </button>

            {shareMessage && <div className="message">{shareMessage}</div>}
        </section>
    );
}