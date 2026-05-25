export default function Upload({
FileName,
setFileName,
FileDescription,
setFileDescription,
setFile,
uploadFile
}) {
    return(
        <section className="card">
          <h3>File Upload</h3>

        <label>
            File Name
            <input
            type="text"
            placeholder="Enter file name"
            value={FileName}
            onChange={(e) => setFileName(e.target.value)}
            required
            />
        </label>

        <label>
            Description
            <textarea
                placeholder="Enter file description"
                value={FileDescription}
                onChange={(e) => setFileDescription(e.target.value)}
                rows="3"
            />
        </label>
        <input
            type="file"
            accept=".txt"
            onChange={(e) => setFile(e.target.files[0])}
        />

        <button className="btn primary" onClick={uploadFile}>
            Upload File
        </button>

        
        </section>
    )
}