# 0.2.0-alpha.1 release acceptance

The final immutable npm artifact is identified by `release-candidate.json`. The exact same tarball passed product-entry fixtures on all seven declared hosts, real DeepSeek API calls on 0.1.7-rc.2, and three-process persistence/restart acceptance. Node 24.21.0 and npm 11.19.0 are pinned for reproducible packing.

`desktop-pre-release.json` explicitly records earlier desktop UI evidence and its earlier artifact hash. It covers the Electron-started desktop Host/profile through Ego Lite, not native Electron renderer control. The final build adds synchronous preset validation and stable LF output. Public-source postpublication acceptance is recorded separately after publishing.

Real API recovery coverage is reported by the coverage field; deterministic fixtures cover all mandatory recovery branches. Raw transcripts and credentials remain outside the repository. Native Windows and Linux unit/build checks and the seven-host matrix run in GitHub CI; local acceptance was on macOS arm64.
