## [0.4.0](https://github.com/anoma/namada-interface/compare/types-v0.3.0...types@v0.4.0) (2025-02-18)


### Features

* Add balance to masp overview ([#1169](https://github.com/anoma/namada-interface/issues/1169)) ([38754bf](https://github.com/anoma/namada-interface/commit/38754bf0e621a955837cb89d07a583b60f9614bf))
* Add build:docs to types package, include generated docs ([#918](https://github.com/anoma/namada-interface/issues/918)) ([a3754f4](https://github.com/anoma/namada-interface/commit/a3754f477e7f9230d186d5e6259d9112ddd1c45a))
* Add info to broadcast tx response ([#919](https://github.com/anoma/namada-interface/issues/919)) ([dc48614](https://github.com/anoma/namada-interface/commit/dc48614a9aad5e97fccacead538d68130baf25d0))
* Add namadillo disconnect button ([#1092](https://github.com/anoma/namada-interface/issues/1092)) ([089b59b](https://github.com/anoma/namada-interface/commit/089b59b219a63283efbb11b5d43e0283f32a8160))
* Add the switch account button ([#1051](https://github.com/anoma/namada-interface/issues/1051)) ([bfc42c3](https://github.com/anoma/namada-interface/commit/bfc42c3ff323a6dee24a91e56f5d2269f96ea8fa))
* Begin integration of IBC with transfer module ([#1162](https://github.com/anoma/namada-interface/issues/1162)) ([08c7e2d](https://github.com/anoma/namada-interface/commit/08c7e2d9186809629abe64741d1a7970b5855958))
* Bump keychain version, update type docs ([#1363](https://github.com/anoma/namada-interface/issues/1363)) ([eece967](https://github.com/anoma/namada-interface/commit/eece96730099ba0d4f5f506c5b4cd2520c82e198))
* Bump shared to namada 0.41.0 ([#948](https://github.com/anoma/namada-interface/issues/948)) ([958b697](https://github.com/anoma/namada-interface/commit/958b69705046e9a5d6d76f07e896721f2217747b))
* Bump to 0.39.0, specify transparent transfer in types ([#858](https://github.com/anoma/namada-interface/issues/858)) ([3ad6200](https://github.com/anoma/namada-interface/commit/3ad620045a6c2c51dda7be0ccc1a2e88b54a959e))
* Enable IBC withdrawals for all tokens ([#1243](https://github.com/anoma/namada-interface/issues/1243)) ([14106eb](https://github.com/anoma/namada-interface/commit/14106eba676c38cc3fee379221359557c5758da2))
* Force bond in the claim and stake flow ([#1370](https://github.com/anoma/namada-interface/issues/1370)) ([a640415](https://github.com/anoma/namada-interface/commit/a640415a25e7b5b74cf6c37644f81b94b3c56911))
* Hook up interface to SDK package, extension signing ([1e2ad8e](https://github.com/anoma/namada-interface/commit/1e2ad8e4ff3c64451e94d36ef9559180fbcd27c5))
* Implement proposal filters and rework types ([6922bc8](https://github.com/anoma/namada-interface/commit/6922bc81a13ef60ca8f85cec898c6b7cac053630))
* Indexer integration part 1 ([#778](https://github.com/anoma/namada-interface/issues/778)) ([0d82ba7](https://github.com/anoma/namada-interface/commit/0d82ba7ea53cd47870f0e3cca01aaa09780323c8))
* **interface:** Removing legacy events ([055019d](https://github.com/anoma/namada-interface/commit/055019dd78725ae3ac43884d9ec887d4b4ab5cd2))
* Post-release bumps, changelogs ([#1364](https://github.com/anoma/namada-interface/issues/1364)) ([a2f3f5c](https://github.com/anoma/namada-interface/commit/a2f3f5cd54ff4bf905b385dc58a9c5d44c2c4ba4))
* Shield nam ([#1165](https://github.com/anoma/namada-interface/issues/1165)) ([e6b5530](https://github.com/anoma/namada-interface/commit/e6b55307c77312a3bdde192ec721d5e84883d4ba))
* Show proposal activation time ([#947](https://github.com/anoma/namada-interface/issues/947)) ([513e1ba](https://github.com/anoma/namada-interface/commit/513e1ba3ebf59dcd07331e3718f6134a22ae0129))
* Support claim rewards tx in SDK ([#932](https://github.com/anoma/namada-interface/issues/932)) ([59d0ea9](https://github.com/anoma/namada-interface/commit/59d0ea9659658c23c804324d46594783ed695a2e))
* Unshield + shielded transfers + disposable gas payer ([#1191](https://github.com/anoma/namada-interface/issues/1191)) ([e8f0b39](https://github.com/anoma/namada-interface/commit/e8f0b39452f0b7fac583ee7cb5812409378cfcd0))
* Update docs in SDK & types ([#1472](https://github.com/anoma/namada-interface/issues/1472)) ([dbcef4f](https://github.com/anoma/namada-interface/commit/dbcef4fa19f0373ae7a328e5c30e1e4dab2b599d))
* Update Keychain for new modified-zip32 ([#1624](https://github.com/anoma/namada-interface/issues/1624)) ([b19caae](https://github.com/anoma/namada-interface/commit/b19caae391b0411f51ee9b48325eeb62d421e7d3))
* Vks birthdays ([#1415](https://github.com/anoma/namada-interface/issues/1415)) ([294031d](https://github.com/anoma/namada-interface/commit/294031d8c7bf53c56fc81404b46d6c63ce13b651))


### Bug Fixes

* Decode continuous pgf proposal to ibc target ([#1397](https://github.com/anoma/namada-interface/issues/1397)) ([1faf1f6](https://github.com/anoma/namada-interface/commit/1faf1f685b629e336f6a0aec1d88e6b06029a39e))
* Move optional value to end of schema, no empty memo ([#1379](https://github.com/anoma/namada-interface/issues/1379)) ([ee49600](https://github.com/anoma/namada-interface/commit/ee496001aad9291e3bb224f91ac5caf31a1143db))
* Replace tally type with two fifths ([#1252](https://github.com/anoma/namada-interface/issues/1252)) ([785d9ad](https://github.com/anoma/namada-interface/commit/785d9ad5d6cf7d7abab53ae9cf812fbbfa84b0f7))

## [0.8.0](https://github.com/namada-net/namada-interface/compare/types@v0.7.0...types@v0.8.0) (2025-08-26)


### Features

* Batch tx to pay fees when unshielding ([#2218](https://github.com/namada-net/namada-interface/issues/2218)) ([aba1977](https://github.com/namada-net/namada-interface/commit/aba19775816796b59e466bc45c9e06da902865c7))

## [0.7.0](https://github.com/anoma/namada-interface/compare/types@v0.6.0...types@v0.7.0) (2025-06-17)


### Features

* Improve error message on wasm errors ([#2025](https://github.com/anoma/namada-interface/issues/2025)) ([0f4f046](https://github.com/anoma/namada-interface/commit/0f4f046f2cf2e5f3d4ed712f1ef7f2762f6be79a))


### Bug Fixes

* Proposal statuses filters ([#2148](https://github.com/anoma/namada-interface/issues/2148)) ([6271ab3](https://github.com/anoma/namada-interface/commit/6271ab3e9c4bbafc851d2f41c7fc399c5d0f8ba4))

## [0.6.0](https://github.com/anoma/namada-interface/compare/types@v0.5.0...types@v0.6.0) (2025-04-17)


### Features

* Ibc unshielding ([#1920](https://github.com/anoma/namada-interface/issues/1920)) ([2996391](https://github.com/anoma/namada-interface/commit/29963912650c4401cb09163042fb889986e094f6))
* Keychain - Display chain name for known chains ([#1968](https://github.com/anoma/namada-interface/issues/1968)) ([ab902e5](https://github.com/anoma/namada-interface/commit/ab902e51564d24c238f1b7b0c0e6ad067decc9e5))
* Keychain/Namadillo: Payment Address gen ([#1905](https://github.com/anoma/namada-interface/issues/1905)) ([200bd4b](https://github.com/anoma/namada-interface/commit/200bd4b400e36b5b216dc5a2facbe92c56c56b0b))
* Namadillo - Improve gasLimit error ([#1977](https://github.com/anoma/namada-interface/issues/1977)) ([b965e07](https://github.com/anoma/namada-interface/commit/b965e071b0b3c54b5081a008ae9e08da8680ebdc))
* SDK - Add lookup for TxResponse result codes ([#1946](https://github.com/anoma/namada-interface/issues/1946)) ([54e2562](https://github.com/anoma/namada-interface/commit/54e2562627c3ffbedcd551d42440872d7a8ead18))
* Update proposal statuses to include executed ([#1904](https://github.com/anoma/namada-interface/issues/1904)) ([843db28](https://github.com/anoma/namada-interface/commit/843db287525e88fb1886ca61414c0b2afe654b82))

## [0.5.0](https://github.com/anoma/namada-interface/compare/types@v0.4.0...types@v0.5.0) (2025-02-28)


### Features

* Extension - Add view and import Spending Key ([#1744](https://github.com/anoma/namada-interface/issues/1744)) ([8306f47](https://github.com/anoma/namada-interface/commit/8306f47aefc51bb4da1f5466637f3697ef87dcbf))


### Bug Fixes

* Proposals checksums and data download ([#1721](https://github.com/anoma/namada-interface/issues/1721)) ([e942a75](https://github.com/anoma/namada-interface/commit/e942a7578e4d8b17898e7c68599883eaa943bde8))

## 0.3.0 (2024-12-02)


### Features

* **138:** reveal pk ([#162](https://github.com/anoma/namada-interface/issues/162)) ([6ac8519](https://github.com/anoma/namada-interface/commit/6ac8519cb841c93af0861563fd163c58f7bc63d3))
* add balance to masp overview ([#1169](https://github.com/anoma/namada-interface/issues/1169)) ([38754bf](https://github.com/anoma/namada-interface/commit/38754bf0e621a955837cb89d07a583b60f9614bf))
* add build:docs to types package, include generated docs ([#918](https://github.com/anoma/namada-interface/issues/918)) ([a3754f4](https://github.com/anoma/namada-interface/commit/a3754f477e7f9230d186d5e6259d9112ddd1c45a))
* add info to broadcast tx response ([#919](https://github.com/anoma/namada-interface/issues/919)) ([dc48614](https://github.com/anoma/namada-interface/commit/dc48614a9aad5e97fccacead538d68130baf25d0))
* add isConnected method and revoke event ([#641](https://github.com/anoma/namada-interface/issues/641)) ([b505250](https://github.com/anoma/namada-interface/commit/b50525079c7d527e69f11e51e627b25b9048b674))
* add linter to the ci ([#247](https://github.com/anoma/namada-interface/issues/247)) ([901627e](https://github.com/anoma/namada-interface/commit/901627e3cdb03e7e1fb74dec25227391c64c2b35))
* add more proposal queries, voting now works ([6f36661](https://github.com/anoma/namada-interface/commit/6f36661689444bcafad0043508b774436400f8f1))
* add namadillo disconnect button ([#1092](https://github.com/anoma/namada-interface/issues/1092)) ([089b59b](https://github.com/anoma/namada-interface/commit/089b59b219a63283efbb11b5d43e0283f32a8160))
* add the switch account button ([#1051](https://github.com/anoma/namada-interface/issues/1051)) ([bfc42c3](https://github.com/anoma/namada-interface/commit/bfc42c3ff323a6dee24a91e56f5d2269f96ea8fa))
* begin integration of IBC with transfer module ([#1162](https://github.com/anoma/namada-interface/issues/1162)) ([08c7e2d](https://github.com/anoma/namada-interface/commit/08c7e2d9186809629abe64741d1a7970b5855958))
* bump keychain version, update type docs ([#1363](https://github.com/anoma/namada-interface/issues/1363)) ([eece967](https://github.com/anoma/namada-interface/commit/eece96730099ba0d4f5f506c5b4cd2520c82e198))
* bump shared to namada 0.41.0 ([#948](https://github.com/anoma/namada-interface/issues/948)) ([958b697](https://github.com/anoma/namada-interface/commit/958b69705046e9a5d6d76f07e896721f2217747b))
* bump to 0.39.0, specify transparent transfer in types ([#858](https://github.com/anoma/namada-interface/issues/858)) ([3ad6200](https://github.com/anoma/namada-interface/commit/3ad620045a6c2c51dda7be0ccc1a2e88b54a959e))
* continue governance, fix up vote summary, query for WASM code ([2c4fc1c](https://github.com/anoma/namada-interface/commit/2c4fc1c15772bebf88f766362662a1ccad5eb70b))
* decode and display pgf_payment proposal data ([c5b255a](https://github.com/anoma/namada-interface/commit/c5b255a8c017601587b89d1db381a62b42e04151))
* enable IBC withdrawals for all tokens ([#1243](https://github.com/anoma/namada-interface/issues/1243)) ([14106eb](https://github.com/anoma/namada-interface/commit/14106eba676c38cc3fee379221359557c5758da2)), closes [#1242](https://github.com/anoma/namada-interface/issues/1242) [#1222](https://github.com/anoma/namada-interface/issues/1222)
* eth bridge transfer ([#382](https://github.com/anoma/namada-interface/issues/382)) ([01263b0](https://github.com/anoma/namada-interface/commit/01263b09de988cbde080776cf8e32c1bb0f0c615))
* get proposal WASM and display in JSON ([6642852](https://github.com/anoma/namada-interface/commit/664285216f0ee513c699f6f27a8dd69749ad4ed6))
* hook up interface to SDK package, extension signing ([1e2ad8e](https://github.com/anoma/namada-interface/commit/1e2ad8e4ff3c64451e94d36ef9559180fbcd27c5))
* implement proposal filters and rework types ([6922bc8](https://github.com/anoma/namada-interface/commit/6922bc81a13ef60ca8f85cec898c6b7cac053630))
* improve proposal JSON display ([7111291](https://github.com/anoma/namada-interface/commit/71112919b52483db77301e066b4ffb72ac68d1c0)), closes [#757](https://github.com/anoma/namada-interface/issues/757)
* indexer integration part 1 ([#778](https://github.com/anoma/namada-interface/issues/778)) ([0d82ba7](https://github.com/anoma/namada-interface/commit/0d82ba7ea53cd47870f0e3cca01aaa09780323c8))
* **interface:** implementing re-delegation flow ([54545ad](https://github.com/anoma/namada-interface/commit/54545adb5da036c2844f986466dcdccbbc6ce940))
* **interface:** removing legacy events ([055019d](https://github.com/anoma/namada-interface/commit/055019dd78725ae3ac43884d9ec887d4b4ab5cd2))
* make governance pages work with no extension ([c937081](https://github.com/anoma/namada-interface/commit/c937081f2215bbbf78878394fd3d3c6fa4d67422))
* masp with disposable key ([#538](https://github.com/anoma/namada-interface/issues/538)) ([0819762](https://github.com/anoma/namada-interface/commit/08197620bb9938aa15f3c2a9e39f557cf2239982))
* more governance improvements ([d727a9a](https://github.com/anoma/namada-interface/commit/d727a9a670245c6e61f76a61ec0d8580741bd97a))
* new governance panels, adding proposals queries ([8df3d72](https://github.com/anoma/namada-interface/commit/8df3d727d7220d1bb71e3855e3850bca409f2aa2))
* proposals ([#351](https://github.com/anoma/namada-interface/issues/351)) ([d6313ee](https://github.com/anoma/namada-interface/commit/d6313eea2976cdf97042e947b698ca636c366a80))
* release scripts ([#578](https://github.com/anoma/namada-interface/issues/578)) ([47100a0](https://github.com/anoma/namada-interface/commit/47100a07fc59118b51285257e7d234bf620cdef2))
* Sdk integration ([#198](https://github.com/anoma/namada-interface/issues/198)) ([1d1a217](https://github.com/anoma/namada-interface/commit/1d1a217637d04155c549b115c27a93d8fae71645)), closes [#204](https://github.com/anoma/namada-interface/issues/204)
* sdk js publish ([#665](https://github.com/anoma/namada-interface/issues/665)) ([ec3dec8](https://github.com/anoma/namada-interface/commit/ec3dec8070219f29ccf95e8a50c880da3f032566))
* send ibc transfer using sdk ([#213](https://github.com/anoma/namada-interface/issues/213)) ([76d49f8](https://github.com/anoma/namada-interface/commit/76d49f8d20c021c96553bf2187c4018de0037ab3))
* setting up Husky + LintStaged + Prettier ([#500](https://github.com/anoma/namada-interface/issues/500)) ([f59d7d2](https://github.com/anoma/namada-interface/commit/f59d7d23acda055b0742a1f4e3ebc9af6b4a3b7b))
* shield nam ([#1165](https://github.com/anoma/namada-interface/issues/1165)) ([e6b5530](https://github.com/anoma/namada-interface/commit/e6b55307c77312a3bdde192ec721d5e84883d4ba))
* shielded balances ([#298](https://github.com/anoma/namada-interface/issues/298)) ([08d4a64](https://github.com/anoma/namada-interface/commit/08d4a640ff3b72219f9db0e98fd91007f31175c8))
* shielded transfers in WebWorker ([#283](https://github.com/anoma/namada-interface/issues/283)) ([5454ac8](https://github.com/anoma/namada-interface/commit/5454ac86c40bf6e9741e9e72f03e755a99e9106b)), closes [#286](https://github.com/anoma/namada-interface/issues/286)
* show proposal activation time ([#947](https://github.com/anoma/namada-interface/issues/947)) ([513e1ba](https://github.com/anoma/namada-interface/commit/513e1ba3ebf59dcd07331e3718f6134a22ae0129))
* staking view integration ([#142](https://github.com/anoma/namada-interface/issues/142)) ([b4cc93e](https://github.com/anoma/namada-interface/commit/b4cc93edbd048f1dbfe0c0c3062c9a526c95e36c))
* support additional testnet tokens ([#529](https://github.com/anoma/namada-interface/issues/529)) ([17c378c](https://github.com/anoma/namada-interface/commit/17c378c8a259e827efcb75d6fb8b10c4309c850d))
* support claim rewards tx in SDK ([#932](https://github.com/anoma/namada-interface/issues/932)) ([59d0ea9](https://github.com/anoma/namada-interface/commit/59d0ea9659658c23c804324d46594783ed695a2e)), closes [#679](https://github.com/anoma/namada-interface/issues/679)
* support memmo field in ibc transfer ([#692](https://github.com/anoma/namada-interface/issues/692)) ([a6e3a68](https://github.com/anoma/namada-interface/commit/a6e3a682f2ba3484c7b0004aace4fd1147b6bdd7))
* transfers from shielded addresses ([#291](https://github.com/anoma/namada-interface/issues/291)) ([2d818d0](https://github.com/anoma/namada-interface/commit/2d818d01e162dd24d60f11d251523c1c519e2378))
* unbound using sdk ([#211](https://github.com/anoma/namada-interface/issues/211)) ([d367c3d](https://github.com/anoma/namada-interface/commit/d367c3dfd8f071794702b747ab95185f62e1e7c7))
* update namada to 0.11.0 ([#158](https://github.com/anoma/namada-interface/issues/158)) ([a43ce14](https://github.com/anoma/namada-interface/commit/a43ce14644d2f121b854f5a483d2e3a8aac43990))
* update to namada 16 ([#275](https://github.com/anoma/namada-interface/issues/275)) ([51326ac](https://github.com/anoma/namada-interface/commit/51326acf925542ba24c756f9de89b16a0fa0b498))
* yarn publish ([#571](https://github.com/anoma/namada-interface/issues/571)) ([62bef6a](https://github.com/anoma/namada-interface/commit/62bef6ab4ddbd09c1c835aa06b6a3577a8b028d2))


### Bug Fixes

* deserialize based on schema fields ([d8ce344](https://github.com/anoma/namada-interface/commit/d8ce344189042de9f1021babca844b46a8d9317b))
* fix typos ([#553](https://github.com/anoma/namada-interface/issues/553)) ([6a78023](https://github.com/anoma/namada-interface/commit/6a78023e08c01a3c93f4e3f49e8773d8a5eba6d8))
* linter and linter issues ([#392](https://github.com/anoma/namada-interface/issues/392)) ([a26bfab](https://github.com/anoma/namada-interface/commit/a26bfabc5f5bd83bb6a46036fdc2259b2a7fa218))
* make getIntegration return a specific integration ([#655](https://github.com/anoma/namada-interface/issues/655)) ([9fc2b3c](https://github.com/anoma/namada-interface/commit/9fc2b3c19e7b7d79f2dfa95f25130f3e383ff5f2))
* prefix environment variables ([#493](https://github.com/anoma/namada-interface/issues/493)) ([570f068](https://github.com/anoma/namada-interface/commit/570f068f85bab1446c98aabd89e2f2f73a4a2ade))
* publish ([#573](https://github.com/anoma/namada-interface/issues/573)) ([ded0b77](https://github.com/anoma/namada-interface/commit/ded0b771d807531d4efe5bc0d6ff2549c79321f4))
* refactor/fix up tokens ([#655](https://github.com/anoma/namada-interface/issues/655)) ([8f80267](https://github.com/anoma/namada-interface/commit/8f802671689db6f959a5002ea5693367646d01d2))
* replace tally type with two fifths ([#1252](https://github.com/anoma/namada-interface/issues/1252)) ([785d9ad](https://github.com/anoma/namada-interface/commit/785d9ad5d6cf7d7abab53ae9cf812fbbfa84b0f7))
* unshiedling ([#656](https://github.com/anoma/namada-interface/issues/656)) ([03856d2](https://github.com/anoma/namada-interface/commit/03856d2981cee3155991418f20ee6122b03e7891))
* update rust imports and implement verify sig ([#603](https://github.com/anoma/namada-interface/issues/603)) ([8b3572d](https://github.com/anoma/namada-interface/commit/8b3572dd39b1853b2d0c6aad8d9f6fdeed5046ef))
* use base 10 instead of base 64 for BNs ([be71d5b](https://github.com/anoma/namada-interface/commit/be71d5b59111681ec67ae7f4eea30f2449d666fe))
* use BigNumber for representing amounts ([66a1919](https://github.com/anoma/namada-interface/commit/66a1919a5b8358da0137c9d34784c01d8586b517))
