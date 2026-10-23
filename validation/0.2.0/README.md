# 0.2.0 release acceptance

The stable plugin targets official Harness 0.2.0-rc.2. `source-contracts.json` records the exact official source comparison; `official-cohort.json` records registry integrity for the complete 278-package DSH closure. `prior-admission.json` reproduces why the earlier plugin preview rejects the new host.

The immutable release artifact and real-provider results are identified by `release-candidate.json`. The same tarball is used for the exact npm Harness product-entry fixture, real DeepSeek API acceptance and three-process persistence checks. The eight declared hosts are gated by the GitHub CI product-entry matrix; unit/build checks also run on Linux, Windows and macOS.

Desktop installation and browser acceptance are outside this release run at the user's explicit request. The user already installed the official application. Earlier desktop evidence remains under the preview release and is not relabeled. Local runtime acceptance uses macOS arm64 and the existing `/tmp` workspace. Credentials and raw transcripts remain outside the repository.
