# Changelog

## [1.31.3](https://github.com/namada-net/namada-interface/compare/namadillo@v1.31.2...namadillo@v1.31.3) (2025-07-30)


### Bug Fixes

* Changed supported asset from NYX to NYM ([#2257](https://github.com/namada-net/namada-interface/issues/2257)) ([da0d851](https://github.com/namada-net/namada-interface/commit/da0d8514e7344d59d97f96a1549f491774875348))
* History filtering ([#2263](https://github.com/namada-net/namada-interface/issues/2263)) ([d8ebad4](https://github.com/namada-net/namada-interface/commit/d8ebad4deed555031590112f6fe3a6699e675892))
* Threshold fix ([#2258](https://github.com/namada-net/namada-interface/issues/2258)) ([12fdcef](https://github.com/namada-net/namada-interface/commit/12fdcefcd03463b7585591e5e244e5632882687f))

### Chores
* Bump namada_sdk ([#2260](https://github.com/namada-net/namada-interface/pull/2260)) ([c817701](https://github.com/namada-net/namada-interface/commit/c817701bb69729ba2d0a41246a24da422660c03f))

## [1.31.2](https://github.com/namada-net/namada-interface/compare/namadillo@v1.31.1...namadillo@v1.31.2) (2025-07-22)


### Bug Fixes

* Update proper staked balance ([#2252](https://github.com/namada-net/namada-interface/issues/2252)) ([f974f0c](https://github.com/namada-net/namada-interface/commit/f974f0c69408daaf06050369069ecb52e5a7fc39))

## [1.31.1](https://github.com/namada-net/namada-interface/compare/namadillo@v1.31.0...namadillo@v1.31.1) (2025-07-16)


### Bug Fixes

* Update registry url to enable shielded rewards ([#2243](https://github.com/namada-net/namada-interface/issues/2243)) ([60d991f](https://github.com/namada-net/namada-interface/commit/60d991f73fc83f97cabb4b062e26ac20d5934076))

## [1.31.0](https://github.com/namada-net/namada-interface/compare/namadillo@v1.30.0...namadillo@v1.31.0) (2025-07-16)


### Features

* Shielded sync retry ([#2176](https://github.com/namada-net/namada-interface/issues/2176)) ([d184643](https://github.com/namada-net/namada-interface/commit/d184643ef99d49d6015d2aca1a23de66b2b9f2c1))


### Bug Fixes

* Add chain logo back to TransactionReceipt for transparent transfers ([#2237](https://github.com/namada-net/namada-interface/issues/2237)) ([7c9c8fc](https://github.com/namada-net/namada-interface/commit/7c9c8fcd999f7b39693cdc784305328efba6136d))
* Assets in shielded rewards calculator ([#2239](https://github.com/namada-net/namada-interface/issues/2239)) ([5614eb8](https://github.com/namada-net/namada-interface/commit/5614eb8d9863a914f8f38653b76dd76cee912f40))
* Do not reveal pk if ibc withdrawing from masp ([#2236](https://github.com/namada-net/namada-interface/issues/2236)) ([68e68ec](https://github.com/namada-net/namada-interface/commit/68e68ec555a9440731ab051d28e460d1e7a61f6c))
* Error notifications ([#2238](https://github.com/namada-net/namada-interface/issues/2238)) ([50d6491](https://github.com/namada-net/namada-interface/commit/50d6491c12f3161001b1b50d18338351c7508de1))

## [1.30.0](https://github.com/namada-net/namada-interface/compare/namadillo@v1.29.0...namadillo@v1.30.0) (2025-07-14)


### Features

* Pick fee token with enough balance ([#2217](https://github.com/namada-net/namada-interface/issues/2217)) ([8368fa4](https://github.com/namada-net/namada-interface/commit/8368fa42d83008ff583cd7737e1a6b39b4151eab))


### Bug Fixes

* Add usdc back to select chain modal ([#2229](https://github.com/namada-net/namada-interface/issues/2229)) ([be68d95](https://github.com/namada-net/namada-interface/commit/be68d95b163514d4c0cb4ed56666e844b1944bc9))
* Do not display refund target error for transparent ibc withdrawals ([#2220](https://github.com/namada-net/namada-interface/issues/2220)) ([7b78563](https://github.com/namada-net/namada-interface/commit/7b7856393526624a33e1ae3682485da4e171eded))
* Reveal pk for ibc withdraw ([#2224](https://github.com/namada-net/namada-interface/issues/2224)) ([4965bfc](https://github.com/namada-net/namada-interface/commit/4965bfc59066a10a709d0768aa9600816ccf07d7))

## [1.29.0](https://github.com/anoma/namada-interface/compare/namadillo@v1.28.2...namadillo@v1.29.0) (2025-07-07)


### Features

* Pick gas fee token with enough balance ([#2206](https://github.com/anoma/namada-interface/issues/2206)) ([478b0e3](https://github.com/anoma/namada-interface/commit/478b0e3b38b7f195112c9c17eb594b67045a2ca4))


### Bug Fixes

* Bonded amount dollar value ([#2214](https://github.com/anoma/namada-interface/issues/2214)) ([552e2ba](https://github.com/anoma/namada-interface/commit/552e2baa305b0fea39354bac422c63c8cb0ebb97))
* Housefire tokens and type import ([#2203](https://github.com/anoma/namada-interface/issues/2203)) ([ecdbf4e](https://github.com/anoma/namada-interface/commit/ecdbf4e5561326f22fb8413d7387cab223320a2c))
* Ibc shielded deposits with nam ([#2191](https://github.com/anoma/namada-interface/issues/2191)) ([c54ef3e](https://github.com/anoma/namada-interface/commit/c54ef3ef2e393c28bb272ebd89fba67f5aca50ef))
* Red toast for partially successful transfers ([#2210](https://github.com/anoma/namada-interface/issues/2210)) ([ca3291c](https://github.com/anoma/namada-interface/commit/ca3291ccecf5908158078cb6f14287a18b7639f8))
* Remove blocker to loading assets ([#2192](https://github.com/anoma/namada-interface/issues/2192)) ([e5c0ef9](https://github.com/anoma/namada-interface/commit/e5c0ef9026801433b5da8c6f56f6c3b0a36a16ed))
* Remove deposit and withdraw tabs for transaction animation ([#2202](https://github.com/anoma/namada-interface/issues/2202)) ([2312c93](https://github.com/anoma/namada-interface/commit/2312c93a819ee874712c24395d941efc4ae17471))
* Update indexer client ([#2197](https://github.com/anoma/namada-interface/issues/2197)) ([7492e84](https://github.com/anoma/namada-interface/commit/7492e8486c3dc367816397ed8166777f0b19d466))
* Update pagination on staking tables ([#2147](https://github.com/anoma/namada-interface/issues/2147)) ([765a579](https://github.com/anoma/namada-interface/commit/765a579d8f754e6a6a42b36ac3b0f72225e957ba))
* Update ranking on shielded fungible table and transparent table ([#2190](https://github.com/anoma/namada-interface/issues/2190)) ([bccae15](https://github.com/anoma/namada-interface/commit/bccae15b32d721fe83ff4fb74d7a68778e3ef3b1))
* Update unshield button with proper route ([#2189](https://github.com/anoma/namada-interface/issues/2189)) ([8653898](https://github.com/anoma/namada-interface/commit/865389833898b845f72adc265b2a90ca3dfff940))

## [1.28.3](https://github.com/anoma/namada-interface/compare/namadillo@v1.28.2...namadillo@v1.28.3) (2025-06-25)


### Bug Fixes

* Ibc shielded deposits with nam ([#2191](https://github.com/anoma/namada-interface/issues/2191)) ([c54ef3e](https://github.com/anoma/namada-interface/commit/c54ef3ef2e393c28bb272ebd89fba67f5aca50ef))

## [1.28.2](https://github.com/anoma/namada-interface/compare/namadillo@v1.28.1...namadillo@v1.28.2) (2025-06-20)


### Bug Fixes

* Show nam from mainnet instead of housefire ([#2187](https://github.com/anoma/namada-interface/issues/2187)) ([3e2fc90](https://github.com/anoma/namada-interface/commit/3e2fc908c2bc3c78e121240a17d98942d379e1fa))

## [1.28.1](https://github.com/anoma/namada-interface/compare/namadillo@v1.28.0...namadillo@v1.28.1) (2025-06-20)


### Bug Fixes

* Missing nam on mainnet ibc deposit ([#2185](https://github.com/anoma/namada-interface/issues/2185)) ([f67a12f](https://github.com/anoma/namada-interface/commit/f67a12f5ece1846de3b694fdc784af099ac0605c))

## [1.28.0](https://github.com/anoma/namada-interface/compare/namadillo@v1.27.0...namadillo@v1.28.0) (2025-06-20)


### Features

* Enable ibc nam on osmosis ([#2178](https://github.com/anoma/namada-interface/issues/2178)) ([030e4e9](https://github.com/anoma/namada-interface/commit/030e4e9571576e7dc528d94a9abe8036e5bc78f6))


### Bug Fixes

* Denominate nam before ibc withdraw ([#2183](https://github.com/anoma/namada-interface/issues/2183)) ([97232e7](https://github.com/anoma/namada-interface/commit/97232e7da04d85c809a0cc367b51ab31e61f5498))
* Displaying housefire nam in mainnet osmosis assets ([#2182](https://github.com/anoma/namada-interface/issues/2182)) ([2f4f662](https://github.com/anoma/namada-interface/commit/2f4f662566bdf156208d2b8404eb6eb45860fd01))
* Update shielded txn receipt ([#2181](https://github.com/anoma/namada-interface/issues/2181)) ([095c340](https://github.com/anoma/namada-interface/commit/095c340320e384796d71486348cd0fc3bc498591))

## [1.27.0](https://github.com/anoma/namada-interface/compare/namadillo@v1.26.0...namadillo@v1.27.0) (2025-06-19)


### Features

* Add preferred infra button to settings ([#2162](https://github.com/anoma/namada-interface/issues/2162)) ([75a30b9](https://github.com/anoma/namada-interface/commit/75a30b94e3e6e87cd9bc319bd9208f19917c9adb))
* Remove masp page ([#2171](https://github.com/anoma/namada-interface/issues/2171)) ([51ac42f](https://github.com/anoma/namada-interface/commit/51ac42fae332525c7ea349012746e0e8a1d211ca))


### Bug Fixes

* Add /1000000 check to history ([#2164](https://github.com/anoma/namada-interface/issues/2164)) ([451ec43](https://github.com/anoma/namada-interface/commit/451ec43fe4e9a97b6815c74971223f494ddf5920))
* Add skeleton for better loading state ([#2063](https://github.com/anoma/namada-interface/issues/2063)) ([a29a73d](https://github.com/anoma/namada-interface/commit/a29a73de691b486a7becffe576904bf791bd6394))
* Hide masp rewards box until phase 4 ([#2172](https://github.com/anoma/namada-interface/issues/2172)) ([5595dc2](https://github.com/anoma/namada-interface/commit/5595dc2f167d27c99093985fce920c82652bef83))
* Parse and display tx fee error ([#2156](https://github.com/anoma/namada-interface/issues/2156)) ([539d45f](https://github.com/anoma/namada-interface/commit/539d45f3cc6412c7555262be7cd7b03ffd500a5d))
* Proposal statuses filters ([#2148](https://github.com/anoma/namada-interface/issues/2148)) ([6271ab3](https://github.com/anoma/namada-interface/commit/6271ab3e9c4bbafc851d2f41c7fc399c5d0f8ba4))
* Shielded balance comma separator ([#2170](https://github.com/anoma/namada-interface/issues/2170)) ([01e5d49](https://github.com/anoma/namada-interface/commit/01e5d49c640396014d09d72cb689efb878458827))
* Unshielding Transfer showing wrong amount in History ([#2155](https://github.com/anoma/namada-interface/issues/2155)) ([2348d03](https://github.com/anoma/namada-interface/commit/2348d037c36243830ef62629a22ad14fe8188f77))
* Update decimal places for 0 shielded rewards ([#2143](https://github.com/anoma/namada-interface/issues/2143)) ([75b24cb](https://github.com/anoma/namada-interface/commit/75b24cb82ce307994cfc6323f11310d2b6f85e8a))

## [1.26.0](https://github.com/anoma/namada-interface/compare/namadillo@v1.25.0...namadillo@v1.26.0) (2025-06-13)


### Features

* Add MASP calculator popup component on Claims card ([#2072](https://github.com/anoma/namada-interface/issues/2072)) ([197c6d9](https://github.com/anoma/namada-interface/commit/197c6d91f7c7aef40639a957c9736f33eef1733a))


### Bug Fixes

* Automagically select first available asset when selecting a chain ([#2115](https://github.com/anoma/namada-interface/issues/2115)) ([b557ac7](https://github.com/anoma/namada-interface/commit/b557ac7edf063ac72b414189d09b415970ae2797))
* Connect wallet larger click surface  ([#2114](https://github.com/anoma/namada-interface/issues/2114)) ([cdb2a05](https://github.com/anoma/namada-interface/commit/cdb2a05f5ff408cd72a11753b0dad01a392a41aa))
* Extend tables on Manage Tab ([#2121](https://github.com/anoma/namada-interface/issues/2121)) ([8231095](https://github.com/anoma/namada-interface/commit/823109576582334cb71ea9d7b76be6d659d33372))
* Filtering out non-native assets for auto-select on Transfer ([#2125](https://github.com/anoma/namada-interface/issues/2125)) ([44577ef](https://github.com/anoma/namada-interface/commit/44577ef8f393f3bbe326fab3a75cdc2d0d04340a))
* Fix super long tooltip ([#2078](https://github.com/anoma/namada-interface/issues/2078)) ([87c3155](https://github.com/anoma/namada-interface/commit/87c31557b2f062f71ab2742da42549e4fd62bd70))
* Remove sidebar shield sync indicator ([#2116](https://github.com/anoma/namada-interface/issues/2116)) ([5b54d7d](https://github.com/anoma/namada-interface/commit/5b54d7d8480e5e5d5970f67b8bde5d05ba683c65))
* Update total balance banner sync dot and transfer source masp sync info ([#2117](https://github.com/anoma/namada-interface/issues/2117)) ([e3273a2](https://github.com/anoma/namada-interface/commit/e3273a220720a3dccc33f7ac19b15b139131d95f))
* Update txn amounts for shielding/unshielding transfers ([#2137](https://github.com/anoma/namada-interface/issues/2137)) ([3706a68](https://github.com/anoma/namada-interface/commit/3706a68650c26eb17fb9b8dfc2ceaf0ac441e39f))
* Use tx wrapper hashes in history and notification toasts for ledger ([#2129](https://github.com/anoma/namada-interface/issues/2129)) ([7c67883](https://github.com/anoma/namada-interface/commit/7c67883caced436c690c3e6439c2123368efcb84))

## [1.25.0](https://github.com/anoma/namada-interface/compare/namadillo@v1.24.0...namadillo@v1.25.0) (2025-06-07)


### Features

* Adding masp sync loading to TransferModule ([#2089](https://github.com/anoma/namada-interface/issues/2089)) ([099145c](https://github.com/anoma/namada-interface/commit/099145ce22d971d3009b58247c33767910603e36))
* Creating new unclaimed rewards box ([#2110](https://github.com/anoma/namada-interface/issues/2110)) ([b9970ff](https://github.com/anoma/namada-interface/commit/b9970ff9f07e8de37b66560434b2303371670078))
* Enable transfers between shielded and transparent addresses in the ([#2109](https://github.com/anoma/namada-interface/issues/2109)) ([dc466f7](https://github.com/anoma/namada-interface/commit/dc466f75f491916793270c0c1832b3589e8c27ce))
* Review spacement around transfer modules ([#2111](https://github.com/anoma/namada-interface/issues/2111)) ([79ad4e8](https://github.com/anoma/namada-interface/commit/79ad4e8a69c1d71fe7fb7e48b3b5011266ee8d8c))


### Bug Fixes

* Images on AssetsModalCard not appearing on Firefox ([#2100](https://github.com/anoma/namada-interface/issues/2100)) ([fd4b75f](https://github.com/anoma/namada-interface/commit/fd4b75f0d403701b689f72c7153f584bcf87a9ac))
* Update history browser alert ([#2090](https://github.com/anoma/namada-interface/issues/2090)) ([1b3f4b9](https://github.com/anoma/namada-interface/commit/1b3f4b9cc12034ffdc20de9908d3bc1367fcb019))

## [1.24.0](https://github.com/anoma/namada-interface/compare/namadillo@v1.23.0...namadillo@v1.24.0) (2025-06-06)


### Features

* Fathom integration ([#2074](https://github.com/anoma/namada-interface/issues/2074)) ([139bb37](https://github.com/anoma/namada-interface/commit/139bb3733b3ea9dc1fbea5f727bfb2167073eaf9))
* Remove buttons from home ([#2088](https://github.com/anoma/namada-interface/issues/2088)) ([8a1d154](https://github.com/anoma/namada-interface/commit/8a1d1541b6e75399f60b4b8b69e670f24a74e294))
* Update sync indicator layout ([#2084](https://github.com/anoma/namada-interface/issues/2084)) ([9077420](https://github.com/anoma/namada-interface/commit/90774204d6a802be360a1a298cb999664b884a34))


### Bug Fixes

* Fix millisecond to second comparison to fix sorting ([#2080](https://github.com/anoma/namada-interface/issues/2080)) ([18a9105](https://github.com/anoma/namada-interface/commit/18a9105582546b2253bdc63e44f1d5f61dac0f28))
* Namada beeing installable ([#2082](https://github.com/anoma/namada-interface/issues/2082)) ([1eea180](https://github.com/anoma/namada-interface/commit/1eea18029ad59466b6f7a08a93a911aad7569c11))
* Passing timestamp in millis instead of seconds to get block height ([#2083](https://github.com/anoma/namada-interface/issues/2083)) ([be3b377](https://github.com/anoma/namada-interface/commit/be3b377c0cfa60d98aba7725c2c3e43b32541745))
* React components keys using asset base ([#2076](https://github.com/anoma/namada-interface/issues/2076)) ([c04cec5](https://github.com/anoma/namada-interface/commit/c04cec5264166600c6da2fdf2b158dea19dde6f1))

## [1.23.0](https://github.com/anoma/namada-interface/compare/namadillo@v1.22.0...namadillo@v1.23.0) (2025-06-04)


### Features

* Masp reward calculator ([#2033](https://github.com/anoma/namada-interface/issues/2033)) ([dbef8b2](https://github.com/anoma/namada-interface/commit/dbef8b208462cf276022345eed0bb096ce8d4acf))
* Update for blinking sync and tooltip addy ([#2059](https://github.com/anoma/namada-interface/issues/2059)) ([952179b](https://github.com/anoma/namada-interface/commit/952179b322de693a96e2a20f4e2c3fb9623fd9c0))
* Update syncing view ([#2066](https://github.com/anoma/namada-interface/issues/2066)) ([cb38729](https://github.com/anoma/namada-interface/commit/cb3872944631d51461827433adcee569c3f519ef))


### Bug Fixes

* Add warning on Transaction History table for MASP txns ([#2070](https://github.com/anoma/namada-interface/issues/2070)) ([a2244f0](https://github.com/anoma/namada-interface/commit/a2244f01964084bb7b53dd26494473d9c4d1185d))
* Awa feedback UI fixes ([#2067](https://github.com/anoma/namada-interface/issues/2067)) ([3fdf237](https://github.com/anoma/namada-interface/commit/3fdf2377f17e5bd37bfb246a94cca67181af6fe8))
* Increase additional percentage for simulated ibc transfer gas fee ([#2068](https://github.com/anoma/namada-interface/issues/2068)) ([1f27ca8](https://github.com/anoma/namada-interface/commit/1f27ca8da402943c655f4eb6689c8215478e7e71))

## [1.22.0](https://github.com/anoma/namada-interface/compare/namadillo@v1.21.0...namadillo@v1.22.0) (2025-05-28)


### Features

* Fix sync indicator ([#2051](https://github.com/anoma/namada-interface/issues/2051)) ([ba8ef63](https://github.com/anoma/namada-interface/commit/ba8ef636e4da9bfeb0d218d1f1209bdd5a14acd2))
* Update syncing light ([#2043](https://github.com/anoma/namada-interface/issues/2043)) ([4658fe2](https://github.com/anoma/namada-interface/commit/4658fe279e74d83ba3af4db8e7621175d77633df))


### Bug Fixes

* Add loader to gas fee modal that waits for shielded data ([#2042](https://github.com/anoma/namada-interface/issues/2042)) ([856fb6e](https://github.com/anoma/namada-interface/commit/856fb6ed4a6dd246cb3540d5c827f57e66a35c74))
* Add relative to div on `/masp/shield` ([#2038](https://github.com/anoma/namada-interface/issues/2038)) ([682c4b9](https://github.com/anoma/namada-interface/commit/682c4b94b10af58d903c08ccc6812147ae9de2f5))
* Adjust gas for ibc deposits and terminate workers to free up memory ([#2049](https://github.com/anoma/namada-interface/issues/2049)) ([e5693bd](https://github.com/anoma/namada-interface/commit/e5693bd1572d4227bace859504100f678bc984ba))
* Delete overflow hidden ([#2041](https://github.com/anoma/namada-interface/issues/2041)) ([fe7afb1](https://github.com/anoma/namada-interface/commit/fe7afb1e3b3be14b38c1899dba5b8845b7fb079a))
* NAM transparent transfer shows generating masp in the button text ([#2044](https://github.com/anoma/namada-interface/issues/2044)) ([8747c25](https://github.com/anoma/namada-interface/commit/8747c258ace55ad4e0b5edee0c594c3280fce055))
* Shielded transfer receipt not showing details ([#2045](https://github.com/anoma/namada-interface/issues/2045)) ([76f4396](https://github.com/anoma/namada-interface/commit/76f4396176f7048a56e7f103e38927faad95a9e3))
* Transferring TIA was displaying 0 on notifications and summary ([#2048](https://github.com/anoma/namada-interface/issues/2048)) ([042a440](https://github.com/anoma/namada-interface/commit/042a440e5f4db9d8d4a007c89971378bcc3165e8))
* Update re-routing after modal close for Staking Rewards Claiming ([#2047](https://github.com/anoma/namada-interface/issues/2047)) ([191662d](https://github.com/anoma/namada-interface/commit/191662d897b6d7180f5595308d30eae75c28d086))
* Update route for claiming on Claim NAM button ([#2046](https://github.com/anoma/namada-interface/issues/2046)) ([12f12d0](https://github.com/anoma/namada-interface/commit/12f12d0bc3c1dad41c7221336d2856f5e704f852))

## [1.21.0](https://github.com/anoma/namada-interface/compare/namadillo@v1.20.2...namadillo@v1.21.0) (2025-05-22)


### Features

* Add Stake transactions to History view ([#2015](https://github.com/anoma/namada-interface/issues/2015)) ([b163061](https://github.com/anoma/namada-interface/commit/b1630610919bfc9f0532630c2ad6a440f7cf1214))
* Change query tx status loop ([#2034](https://github.com/anoma/namada-interface/issues/2034)) ([b7514c1](https://github.com/anoma/namada-interface/commit/b7514c13a686aea842ea30ecaa42f67c52238b1b))
* Improve error message on wasm errors ([#2025](https://github.com/anoma/namada-interface/issues/2025)) ([0f4f046](https://github.com/anoma/namada-interface/commit/0f4f046f2cf2e5f3d4ed712f1ef7f2762f6be79a))
* Update new staking section features for v2 ([#2028](https://github.com/anoma/namada-interface/issues/2028)) ([536b30b](https://github.com/anoma/namada-interface/commit/536b30bb56b0cd37e87c40e245f932399bf47099))


### Bug Fixes

* Namadillo v2 fixes ([#1994](https://github.com/anoma/namada-interface/issues/1994)) ([2b7293d](https://github.com/anoma/namada-interface/commit/2b7293df51414bcbb183283e48f8fa7faece41c5))
* Restore transaction details page ([#2022](https://github.com/anoma/namada-interface/issues/2022)) ([17f9cce](https://github.com/anoma/namada-interface/commit/17f9ccecb1950d0bcf222ee956d25087deaaf38e))
* Show Staking sidebar button even if there is 0 to claim ([#2024](https://github.com/anoma/namada-interface/issues/2024)) ([9b155e2](https://github.com/anoma/namada-interface/commit/9b155e24cb55ed01ec2c375ee079c26c521b0b9b))
* Update sdk lnk to npmjs ([#1997](https://github.com/anoma/namada-interface/issues/1997)) ([f021951](https://github.com/anoma/namada-interface/commit/f021951fafd95abdc737a258e75306a9ea99d252))
* Use circle version of neutron chain ([#2021](https://github.com/anoma/namada-interface/issues/2021)) ([351376e](https://github.com/anoma/namada-interface/commit/351376eeeb3c796248c2f43a3c7c5174f2170aaa))

## [1.20.2](https://github.com/anoma/namada-interface/compare/namadillo@v1.20.1...namadillo@v1.20.2) (2025-05-13)


### Bug Fixes

* Add await back to gas claiming and update indexer client ([#2003](https://github.com/anoma/namada-interface/issues/2003)) ([8009f5c](https://github.com/anoma/namada-interface/commit/8009f5c6bb87643d3d8009b17855296888bb16b2))
* Missing new ibc tokens and withdraw channels ([#2018](https://github.com/anoma/namada-interface/issues/2018)) ([54303e1](https://github.com/anoma/namada-interface/commit/54303e1cdd757ce9c7ca94e514f0fc2fa110afd8))

## [1.20.1](https://github.com/anoma/namada-interface/compare/namadillo@v1.20.0...namadillo@v1.20.1) (2025-05-08)


### Bug Fixes

* Bump indexer to 3.0.1 ([#2007](https://github.com/anoma/namada-interface/issues/2007)) ([1f60c91](https://github.com/anoma/namada-interface/commit/1f60c9188ebafe62049e6037355b97415bf7e524))
* Update Rust toolchain in Dockerfiles ([#2002](https://github.com/anoma/namada-interface/pull/2002)) ([b571d36](https://github.com/anoma/namada-interface/commit/b571d36612aca4b6f372eca3c9f95969b377bd69))
* Update gas claiming estimate ([#2001](https://github.com/anoma/namada-interface/pull/2001)) ([10b258c](https://github.com/anoma/namada-interface/commit/10b258cf9f0b5f7e7d0dde00fa44c8efb5d38bff))
* Updating Rust toolchain & SDK version ([#1999](https://github.com/anoma/namada-interface/pull/1999)) ([2769085](https://github.com/anoma/namada-interface/commit/27690857b836dcfca8263edda820de1df4bcf821))

## [1.20.0](https://github.com/anoma/namada-interface/compare/namadillo@v1.19.0...namadillo@v1.20.0) (2025-04-29)


### Features

* Add Est. Rewards to staking dash ([#1913](https://github.com/anoma/namada-interface/issues/1913)) ([851d1b0](https://github.com/anoma/namada-interface/commit/851d1b026e121a2abd5d24ee6526b8961c09c0f3))
* Add sticky left nav ([#1954](https://github.com/anoma/namada-interface/issues/1954)) ([8619239](https://github.com/anoma/namada-interface/commit/86192393386d7e82467dbb0c4f980296f0b47871))
* Allow validators to have an individual URL or share link ([#1944](https://github.com/anoma/namada-interface/issues/1944)) ([e4d0818](https://github.com/anoma/namada-interface/commit/e4d08181cacea363b2c3fa1def9861fde5847823))
* Ibc unshielding ([#1920](https://github.com/anoma/namada-interface/issues/1920)) ([2996391](https://github.com/anoma/namada-interface/commit/29963912650c4401cb09163042fb889986e094f6))
* Keychain/Namadillo: Payment Address gen ([#1905](https://github.com/anoma/namada-interface/issues/1905)) ([200bd4b](https://github.com/anoma/namada-interface/commit/200bd4b400e36b5b216dc5a2facbe92c56c56b0b))
* Namadillo - Improve gasLimit error ([#1977](https://github.com/anoma/namada-interface/issues/1977)) ([b965e07](https://github.com/anoma/namada-interface/commit/b965e071b0b3c54b5081a008ae9e08da8680ebdc))
* Namadillo v2 feedback ([#1973](https://github.com/anoma/namada-interface/issues/1973)) ([3762a8b](https://github.com/anoma/namada-interface/commit/3762a8b16052536fedea4e6e63185f6d5b784938))
* Overview Dashboard v2 ([#1951](https://github.com/anoma/namada-interface/issues/1951)) ([8deb9a4](https://github.com/anoma/namada-interface/commit/8deb9a46306af48b22d5de0458f46a2f3f1b938b))
* SDK - Add lookup for TxResponse result codes ([#1946](https://github.com/anoma/namada-interface/issues/1946)) ([54e2562](https://github.com/anoma/namada-interface/commit/54e2562627c3ffbedcd551d42440872d7a8ead18))


### Bug Fixes

* Add burger menu close ([#1943](https://github.com/anoma/namada-interface/issues/1943)) ([41df5c7](https://github.com/anoma/namada-interface/commit/41df5c77eaaed42cb9c7d7afa56f2908dd0a045f))
* Add ceiling on gas estimates ([#1949](https://github.com/anoma/namada-interface/issues/1949)) ([78edeb2](https://github.com/anoma/namada-interface/commit/78edeb2d2f4ccfe3e083f37bae437905b06e9a5a))
* Check that the chain in custom address matches address prefix ([#1945](https://github.com/anoma/namada-interface/issues/1945)) ([3cf5124](https://github.com/anoma/namada-interface/commit/3cf5124b0796c011ee5bfb4b17aaea97b0ea30e1))
* Fix claim and stake NaN issue ([#1957](https://github.com/anoma/namada-interface/issues/1957)) ([c115bce](https://github.com/anoma/namada-interface/commit/c115bce8ed1f8d9763dcf7315d80fb87c8034f86))
* Fix z index ([#1962](https://github.com/anoma/namada-interface/issues/1962)) ([1743e55](https://github.com/anoma/namada-interface/commit/1743e554763884eaf21eef82cd70af2e2c927334))
* Infinite balance query loop ([#1984](https://github.com/anoma/namada-interface/issues/1984)) ([2610bb0](https://github.com/anoma/namada-interface/commit/2610bb0ad2d74ab61bed820847cbe23ae1985663))
* Namadillo Status Indicator conflates RPC and Indexer status ([#1934](https://github.com/anoma/namada-interface/issues/1934)) ([af6252c](https://github.com/anoma/namada-interface/commit/af6252c44e3dab0c0d09cb4ff15745977843e49f))
* Pending notification not being removed on IBC Withdraw ([#1906](https://github.com/anoma/namada-interface/issues/1906)) ([789e785](https://github.com/anoma/namada-interface/commit/789e785c74e4f6d9560d65f2f0f63787beddc028))
* Refetch balances after all types of transfers ([#1938](https://github.com/anoma/namada-interface/issues/1938)) ([4ebccb8](https://github.com/anoma/namada-interface/commit/4ebccb800432325d039c67af37af71486a84b713))
* Rollover Namada address in the top right is cut of when the keplr logo is not present  ([#1970](https://github.com/anoma/namada-interface/issues/1970)) ([494961b](https://github.com/anoma/namada-interface/commit/494961b771c2e854004696e0caec08479e3e643a))
* Update all css for v2 transfer flow ([#1981](https://github.com/anoma/namada-interface/issues/1981)) ([a73023a](https://github.com/anoma/namada-interface/commit/a73023a9847927375a97cd5498966edad4abd7b1))
* Update apr and table height ([#1978](https://github.com/anoma/namada-interface/issues/1978)) ([dedbae7](https://github.com/anoma/namada-interface/commit/dedbae7e806a646649051a09499b31d03fef0091))
* Update est rewards rate ([#1942](https://github.com/anoma/namada-interface/issues/1942)) ([a2748d3](https://github.com/anoma/namada-interface/commit/a2748d34c844557a65c463703f0ee4c0675f3814))
* Update gas calculations ([#1939](https://github.com/anoma/namada-interface/issues/1939)) ([cf47655](https://github.com/anoma/namada-interface/commit/cf476552fad2f3385cdcc4502fcb826dd6f31b1d))
* Update logic for ibc transfers from NAM ([#1959](https://github.com/anoma/namada-interface/issues/1959)) ([d361e04](https://github.com/anoma/namada-interface/commit/d361e04c23a03ccc18cfec0065182bc5604dd851))
* Update native balance to be 0 in staking panel ([#1919](https://github.com/anoma/namada-interface/issues/1919)) ([8658835](https://github.com/anoma/namada-interface/commit/865883579fb79e015ca76e8c3e68ba6877109148))
* Update status syncing atom so its not perpetually syncing ([#1948](https://github.com/anoma/namada-interface/issues/1948)) ([2347945](https://github.com/anoma/namada-interface/commit/23479450c14b14b6d4eb016c6e33dc5077e7c90c))

## [1.19.0](https://github.com/anoma/namada-interface/compare/namadillo@v1.18.0...namadillo@v1.19.0) (2025-03-17)


### Features

* Only display unbond in the top overview when a user is unbonding [#1743](https://github.com/anoma/namada-interface/issues/1743) ([#1896](https://github.com/anoma/namada-interface/issues/1896)) ([04ac120](https://github.com/anoma/namada-interface/commit/04ac120c4d756a2344d253f3a9883c1097fe4380))
* Update proposal statuses to include executed ([#1904](https://github.com/anoma/namada-interface/issues/1904)) ([843db28](https://github.com/anoma/namada-interface/commit/843db287525e88fb1886ca61414c0b2afe654b82))
* Update to links for all software versions in extension ([#1912](https://github.com/anoma/namada-interface/issues/1912)) ([4b6f3e5](https://github.com/anoma/namada-interface/commit/4b6f3e5e79d2eeff532ce9c31b10cdbf2a7a2d54))


### Bug Fixes

* ExecutedRejected proposals status ([#1910](https://github.com/anoma/namada-interface/issues/1910)) ([6dbf4a7](https://github.com/anoma/namada-interface/commit/6dbf4a726eb74060526b1935bee78469ed18fefd))

## [1.18.0](https://github.com/anoma/namada-interface/compare/namadillo@v1.17.0...namadillo@v1.18.0) (2025-03-12)


### Features

* Check namadillo version to invalidate shielded context ([#1887](https://github.com/anoma/namada-interface/issues/1887)) ([352e547](https://github.com/anoma/namada-interface/commit/352e5473ebee93028dec43ad492b435af04499a6))
* Handling new proposal types ([#1899](https://github.com/anoma/namada-interface/issues/1899)) ([caea8fa](https://github.com/anoma/namada-interface/commit/caea8fa1854f3307138fe0cb41a650121c84a1dc))
* Improve sync indicator error message ([#1892](https://github.com/anoma/namada-interface/issues/1892)) ([024ed2d](https://github.com/anoma/namada-interface/commit/024ed2d404f6c3cd7bbe5e4018267a1a05faa8d6))


### Bug Fixes

* Add z-index to prevent address hiding in IBC transfer ([a61f13e](https://github.com/anoma/namada-interface/commit/a61f13e40664b67f7e9fa05763a47c3b6f969a8c))
* Add z-index to prevent address hiding in IBC transfer ([bac2265](https://github.com/anoma/namada-interface/commit/bac2265ce9e9f505b77372937c72725c223ce3f8))
* Fix notification toast pending ([#1894](https://github.com/anoma/namada-interface/issues/1894)) ([66ba33d](https://github.com/anoma/namada-interface/commit/66ba33dde1febf445c4721372c15b0ff8d8c9de8))
* Fixing transaction receipt details not appearing for shielding transfers ([#1897](https://github.com/anoma/namada-interface/issues/1897)) ([17ac8f8](https://github.com/anoma/namada-interface/commit/17ac8f8bfd6cce62cb34a337fd026a3b01cd5956))
* Fixing unshield, shield and other transactions ([#1893](https://github.com/anoma/namada-interface/issues/1893)) ([0d0cfaa](https://github.com/anoma/namada-interface/commit/0d0cfaac8eda724a5d1e16d400a8f3b8cbaf879d))
* **ibc-withdraw:** Fixing wallet address after selecting a new chain ([597bcb7](https://github.com/anoma/namada-interface/commit/597bcb763ba4a18ccc69ac47b76b0bae5332dcca))
* **ibc-withdraw:** Fixing wallet address after selecting a new chain ([fe2d80b](https://github.com/anoma/namada-interface/commit/fe2d80b8086bb828d78054d64f82a6954d8d801f))
* Settings ([90580ba](https://github.com/anoma/namada-interface/commit/90580ba1be098fb753039f588cf00b84de961243))
* Tokens sometimes not rendering correctly after refreshing masp page ([a457df7](https://github.com/anoma/namada-interface/commit/a457df703f387106f433b61b9b2deed6d37f61b9))
* Tokens sometimes not rendering correctly after refreshing masp page ([ca288be](https://github.com/anoma/namada-interface/commit/ca288be72d3056cb4b2678ddb082847b634753f4))

## [1.17.0](https://github.com/anoma/namada-interface/compare/namadillo@v1.16.0...namadillo@v1.17.0) (2025-03-10)


### Features

* Add button to copy shielded address ([#1866](https://github.com/anoma/namada-interface/issues/1866)) ([151e2f7](https://github.com/anoma/namada-interface/commit/151e2f739eaaf2e0225fa5161473eeaa44c56f60))
* Add masp indexer version ([#1861](https://github.com/anoma/namada-interface/issues/1861)) ([37bd3f7](https://github.com/anoma/namada-interface/commit/37bd3f7d988bdc89667594afc74194fbc086c5f0))
* Add warning for tokens from inactive channel ([#1868](https://github.com/anoma/namada-interface/issues/1868)) ([cb94b40](https://github.com/anoma/namada-interface/commit/cb94b4082f2578a8d660ee2db20ec2664d164efc))
* Adding pro-mode control and hiding advanced settings panel ([#1876](https://github.com/anoma/namada-interface/issues/1876)) ([075d6ce](https://github.com/anoma/namada-interface/commit/075d6ce883b9d961773d96c2d933788545e7122c))
* Changing tab and text colors on TabContainer ([#1865](https://github.com/anoma/namada-interface/issues/1865)) ([050f9b1](https://github.com/anoma/namada-interface/commit/050f9b1ab49f7e774e0db58f3936cd5ef4552fd7))
* Creating a new version for Claim Rewards modal ([#1874](https://github.com/anoma/namada-interface/issues/1874)) ([0cb97f2](https://github.com/anoma/namada-interface/commit/0cb97f2087f320fe2b8324ff2ee83e772b9dc69c))
* Falling back to other fee tokens if user has no nams ([#1852](https://github.com/anoma/namada-interface/issues/1852)) ([d686235](https://github.com/anoma/namada-interface/commit/d686235fbd9a9a6f9aeea5683e85028ab80efa32))
* Filter out tokens that does not exist on chain ([#1849](https://github.com/anoma/namada-interface/issues/1849)) ([01e2393](https://github.com/anoma/namada-interface/commit/01e2393738303e7554d2deba773dbd5b76ee7fe4))
* Improving token selection modal ([#1859](https://github.com/anoma/namada-interface/issues/1859)) ([ae73f70](https://github.com/anoma/namada-interface/commit/ae73f703991c10b02eac1c7c350b058445cf657d))
* Invalidate shielded context based on indexer version ([#1853](https://github.com/anoma/namada-interface/issues/1853)) ([99d05a7](https://github.com/anoma/namada-interface/commit/99d05a703de44689cd573c4181ea950e2d7155e8))
* Remove compatibility checks for namadillo extension and indexers versions ([#1840](https://github.com/anoma/namada-interface/issues/1840)) ([b90a7a4](https://github.com/anoma/namada-interface/commit/b90a7a472371542271e993ecd1b132857a71b0f5))
* Renaming masp annual inflation table title ([#1877](https://github.com/anoma/namada-interface/issues/1877)) ([2b1f3e1](https://github.com/anoma/namada-interface/commit/2b1f3e1262996d902629ae3b0f2d924d0f6a4112))
* Set min masp version ([#1879](https://github.com/anoma/namada-interface/issues/1879)) ([47aaafb](https://github.com/anoma/namada-interface/commit/47aaafbaa27b72b5048db7bf26b225b132cd2143))
* Starting the advanced mode feature on Namadillo ([#1864](https://github.com/anoma/namada-interface/issues/1864)) ([a45d3a7](https://github.com/anoma/namada-interface/commit/a45d3a7b659d6a1e113a1332892d1e28cae1d8dd))
* Update overview and staking chart rollover state ([#1871](https://github.com/anoma/namada-interface/issues/1871)) ([e409d4c](https://github.com/anoma/namada-interface/commit/e409d4ceffa4fca9b2700568ed0e44f77b62d2e6))
* Update transaction fee button ([#1843](https://github.com/anoma/namada-interface/issues/1843)) ([6aa40fd](https://github.com/anoma/namada-interface/commit/6aa40fddc38a596ab86ce28bb4b518c3f2e1cc0b))


### Bug Fixes

* Displaying on the loading panel the correct target address ([#1837](https://github.com/anoma/namada-interface/issues/1837)) ([901db3e](https://github.com/anoma/namada-interface/commit/901db3ed6cf343a582c9672c1b506362a157573f))
* Displaying shielded balances on modal fees for shielded transfers ([#1872](https://github.com/anoma/namada-interface/issues/1872)) ([641df04](https://github.com/anoma/namada-interface/commit/641df0447d20f2510ee9f7ecafd84f6d0d385f27))
* Fix Keplr signing when source is Ledger HW Wallet ([#1838](https://github.com/anoma/namada-interface/issues/1838)) ([39e741a](https://github.com/anoma/namada-interface/commit/39e741a42cd801e16b33f4b8197880874a4c6749))
* Fix link for ibc asset withdraw ([#1858](https://github.com/anoma/namada-interface/issues/1858)) ([6e3935b](https://github.com/anoma/namada-interface/commit/6e3935b4d9d715ea2038e35012d5e0354029d27f))
* Fix transaction fee layout ([#1855](https://github.com/anoma/namada-interface/issues/1855)) ([4ad898e](https://github.com/anoma/namada-interface/commit/4ad898e7b7a2287e6fd909adca9c60a8c4c4e93e))
* If account is Ledger, don't show sign arbitrary button ([#1860](https://github.com/anoma/namada-interface/issues/1860)) ([a80235c](https://github.com/anoma/namada-interface/commit/a80235ceaa04527e48adf8870152269f704e1f3c))
* Typo on sidebar ([#1844](https://github.com/anoma/namada-interface/issues/1844)) ([6520633](https://github.com/anoma/namada-interface/commit/6520633421041ead0457f8a8cf9b8d6e0ce768ee))

## [1.16.0](https://github.com/anoma/namada-interface/compare/namadillo@v1.15.1...namadillo@v1.16.0) (2025-03-07)


### Features

* Add footer logo to all pages ([#1811](https://github.com/anoma/namada-interface/issues/1811)) ([e805484](https://github.com/anoma/namada-interface/commit/e8054849299d94640f7399d3fe27aaa8bf29bed6))
* Add rewards column ([#1793](https://github.com/anoma/namada-interface/issues/1793)) ([75c65cf](https://github.com/anoma/namada-interface/commit/75c65cfdb20abbe48b827f8005bd716ef2027c21))
* Adding masp asset rewards panel info ([#1797](https://github.com/anoma/namada-interface/issues/1797)) ([3b1a197](https://github.com/anoma/namada-interface/commit/3b1a197aac9153d5f549a9f2c68b92a4b022e3df))
* Alter yellow warning banner ([#1803](https://github.com/anoma/namada-interface/issues/1803)) ([3d79203](https://github.com/anoma/namada-interface/commit/3d79203fa5942877f6b668d4cc433009e9d6c870))
* Bumping minimum compatibility for the indexer ([#1836](https://github.com/anoma/namada-interface/issues/1836)) ([cdbfa27](https://github.com/anoma/namada-interface/commit/cdbfa274e2eb846e6467b2c3706cf674f3f4cddc))
* Creating staking withdraw modal, with a fee selector ([#1835](https://github.com/anoma/namada-interface/issues/1835)) ([1e79fc1](https://github.com/anoma/namada-interface/commit/1e79fc144710925148c58dd592d5c07d30672270))
* Improving bug report info gathering ([#1825](https://github.com/anoma/namada-interface/issues/1825)) ([c7ca25f](https://github.com/anoma/namada-interface/commit/c7ca25fe1cbeccd366158fc412ef513be59b5a70))
* Use indexer services timestamps in status check ([#1830](https://github.com/anoma/namada-interface/issues/1830)) ([9ad448c](https://github.com/anoma/namada-interface/commit/9ad448c158c7baf2cc591ba3f9a835c5dcebdf1e))


### Bug Fixes

* Add destination chain id ([#1799](https://github.com/anoma/namada-interface/issues/1799)) ([971bf1c](https://github.com/anoma/namada-interface/commit/971bf1c0560159358fe4ca2c9773669abcac2372))

## [1.15.1](https://github.com/anoma/namada-interface/compare/namadillo@v1.15.0...namadillo@v1.15.1) (2025-03-03)


### Bug Fixes

* Add USB device type dependencies to Namadillo, fix return type ([#1805](https://github.com/anoma/namada-interface/issues/1805)) ([8941597](https://github.com/anoma/namada-interface/commit/8941597a1b4eaf1f4f4e7f414d82ab2e3fcf13c7))

## [1.15.0](https://github.com/anoma/namada-interface/compare/namadillo@v1.14.0...namadillo@v1.15.0) (2025-03-03)


### Features

* Add active below threshold trait ([#1773](https://github.com/anoma/namada-interface/issues/1773)) ([75f5c3e](https://github.com/anoma/namada-interface/commit/75f5c3e5b5ab4adf01c535e8613cb6e86a8bd0ef))
* Revert change to SwitchAccountPanel filter ([#1788](https://github.com/anoma/namada-interface/issues/1788)) ([27bc07d](https://github.com/anoma/namada-interface/commit/27bc07d5c725911a0de56b40df421cf24446bc83))


### Bug Fixes

* Bumping extension required version to 0.5.x ([#1794](https://github.com/anoma/namada-interface/issues/1794)) ([193365f](https://github.com/anoma/namada-interface/commit/193365ff145f54d37c4859da90152424cea1bf9d))

## [1.14.0](https://github.com/anoma/namada-interface/compare/namadillo@v1.13.0...namadillo@v1.14.0) (2025-02-27)


### Features

* Limit ibc withdrawal of assets only for the same chain ([#1783](https://github.com/anoma/namada-interface/issues/1783)) ([8a960b1](https://github.com/anoma/namada-interface/commit/8a960b14ced2914185b017785f65a249eff200e7))
* Tweaking black color on all apps ([#1784](https://github.com/anoma/namada-interface/issues/1784)) ([a9460aa](https://github.com/anoma/namada-interface/commit/a9460aa0ab0ea19605f8b7dd1e754f88f65d5501))

## [1.13.0](https://github.com/anoma/namada-interface/compare/namadillo@v1.12.1...namadillo@v1.13.0) (2025-02-27)


### Features

* Allow predefining transparent source for transfers ([#1762](https://github.com/anoma/namada-interface/issues/1762)) ([43315f6](https://github.com/anoma/namada-interface/commit/43315f69a24840e33a149d64934c8a8a73733887))
* Changing indexer compatibility message to redirect users to Namada Apps ([#1779](https://github.com/anoma/namada-interface/issues/1779)) ([902df42](https://github.com/anoma/namada-interface/commit/902df428daf9f479dd03cf104228c95d7d81bd4f))
* Extension - Add view and import Spending Key ([#1744](https://github.com/anoma/namada-interface/issues/1744)) ([8306f47](https://github.com/anoma/namada-interface/commit/8306f47aefc51bb4da1f5466637f3697ef87dcbf))
* Filter only enabled assets ([#1753](https://github.com/anoma/namada-interface/issues/1753)) ([98866f1](https://github.com/anoma/namada-interface/commit/98866f1893fc93d84ed8ca38461bd3157082a8d5))


### Bug Fixes

* Cleanup connect button functionality ([#1757](https://github.com/anoma/namada-interface/issues/1757)) ([3f530fb](https://github.com/anoma/namada-interface/commit/3f530fbe87192985b2ece28f94d00227e5ba6616))
* Fix claim and stake fee inverted ([#1748](https://github.com/anoma/namada-interface/issues/1748)) ([4451f01](https://github.com/anoma/namada-interface/commit/4451f01f926d3f7d557012167f423fc5d260ca1a))
* Fixing regex to get denom from ibc trace ([#1755](https://github.com/anoma/namada-interface/issues/1755)) ([fc7770c](https://github.com/anoma/namada-interface/commit/fc7770ca10f2d87e2c520a07a7e9004c9332fafb))
* Hide shielded keys on switch account panel ([#1781](https://github.com/anoma/namada-interface/issues/1781)) ([a1fa2ae](https://github.com/anoma/namada-interface/commit/a1fa2aee2fc51af0b3c4ac1ce994acfe9937e189))
* Increasing additional gas to avoid some ibc transactions failing ([#1768](https://github.com/anoma/namada-interface/issues/1768)) ([0ebf818](https://github.com/anoma/namada-interface/commit/0ebf818a66ca2a13ebee53fc025e7f106c19838f))
* Left align retro card amounts ([#1771](https://github.com/anoma/namada-interface/issues/1771)) ([55ff88a](https://github.com/anoma/namada-interface/commit/55ff88aaa7eb5cee5c44e978cef0f4b6d13a1395))
* Move stake button when transfer's locked ([#1770](https://github.com/anoma/namada-interface/issues/1770)) ([273f881](https://github.com/anoma/namada-interface/commit/273f8819203b8b2043fae3ee428947ba93ec61e3))
* Show validators outside consensus and update tooltip icon ([#1686](https://github.com/anoma/namada-interface/issues/1686)) ([dca2af3](https://github.com/anoma/namada-interface/commit/dca2af366570d329daf323ab63890d169abe018b))
* Update token sorting logic ([#1687](https://github.com/anoma/namada-interface/issues/1687)) ([14f2ab2](https://github.com/anoma/namada-interface/commit/14f2ab275a1cb0613f1bc57dfaeb34628969d0f2))
* Update transparent balance after transfer ([#1731](https://github.com/anoma/namada-interface/issues/1731)) ([ec48723](https://github.com/anoma/namada-interface/commit/ec4872392f71c1252ca907f8a46853e395747470))

## [1.12.1](https://github.com/anoma/namada-interface/compare/namadillo@v1.12.0...namadillo@v1.12.1) (2025-02-25)


### Bug Fixes

* Add fallback for missing gas estimates ([#1739](https://github.com/anoma/namada-interface/issues/1739)) ([2b557c3](https://github.com/anoma/namada-interface/commit/2b557c3fb61e0abb89ce6920eae22116362b9ff0))
* Fix claim rewards fee button ([#1732](https://github.com/anoma/namada-interface/issues/1732)) ([18d54ed](https://github.com/anoma/namada-interface/commit/18d54ed83bd05f7a9976f749674b8f1c867a02ee))
* Fix missing nam asset ([#1736](https://github.com/anoma/namada-interface/issues/1736)) ([fe5a760](https://github.com/anoma/namada-interface/commit/fe5a760cc9700e9c4a4bdaa83e18cf5de7299f46))
* Updating alpha banner text ([#1733](https://github.com/anoma/namada-interface/issues/1733)) ([14de40c](https://github.com/anoma/namada-interface/commit/14de40c9e03f5fe5f9fc73585f07376480ffd74b))

## [1.12.0](https://github.com/anoma/namada-interface/compare/namadillo@v1.11.1...namadillo@v1.12.0) (2025-02-24)


### Features

* Add educational content ([#1726](https://github.com/anoma/namada-interface/issues/1726)) ([198e0b9](https://github.com/anoma/namada-interface/commit/198e0b96c48e0f4af2c07278d28983e27d726d08))
* Add shield assets modal on sidebar banner ([#1724](https://github.com/anoma/namada-interface/issues/1724)) ([9751573](https://github.com/anoma/namada-interface/commit/975157321a59816fea6fc84f4a639aa849354924))
* Adding alpha warning ([#1727](https://github.com/anoma/namada-interface/issues/1727)) ([6e1476b](https://github.com/anoma/namada-interface/commit/6e1476b3ae54403326a508140b9c71fb17fec250))
* Show namadillo version when disconnected from keychain ([#1685](https://github.com/anoma/namada-interface/issues/1685)) ([980e7d3](https://github.com/anoma/namada-interface/commit/980e7d3da2b3d016e85eac44475f9f5fa7f1aac9))


### Bug Fixes

* Fix for accounts with all tokens with balance zero ([#1707](https://github.com/anoma/namada-interface/issues/1707)) ([6275ab6](https://github.com/anoma/namada-interface/commit/6275ab6a5bdaafe55ed16d25b87cae6fe77824a5))
* Proposals checksums and data download ([#1721](https://github.com/anoma/namada-interface/issues/1721)) ([e942a75](https://github.com/anoma/namada-interface/commit/e942a7578e4d8b17898e7c68599883eaa943bde8))
* Unregister buggy service worker ([#1725](https://github.com/anoma/namada-interface/issues/1725)) ([5b70454](https://github.com/anoma/namada-interface/commit/5b704547cd5fd250f8db390fe28bcf693c813d57))
* Update retro card ([#1712](https://github.com/anoma/namada-interface/issues/1712)) ([5432e71](https://github.com/anoma/namada-interface/commit/5432e71d3c3902fb73c436ae3d878a857582fca2))

## [1.11.1](https://github.com/anoma/namada-interface/compare/namadillo@v1.11.0...namadillo@v1.11.1) (2025-02-21)


### Bug Fixes

* Bumping indexer version to 2.1.x ([#1708](https://github.com/anoma/namada-interface/issues/1708)) ([520e8ca](https://github.com/anoma/namada-interface/commit/520e8ca5e86a1abf7fcc514d09824fb679af5120))

## [1.11.0](https://github.com/anoma/namada-interface/compare/namadillo@v1.10.2...namadillo@v1.11.0) (2025-02-21)


### Features

* Add transaction fee to claiming modal ([#1673](https://github.com/anoma/namada-interface/issues/1673)) ([d8b007e](https://github.com/anoma/namada-interface/commit/d8b007e873c9a18ff4b28dc3a3eb48a37adc452d))
* Adding multicore as default option for Namadillo and publishing sdk packages automatically to npm ([#1582](https://github.com/anoma/namada-interface/issues/1582)) ([bdc90bd](https://github.com/anoma/namada-interface/commit/bdc90bdffd907f111d41840eef6c6e6df8077b7e))
* Filtering assets with zero amount in it ([#1702](https://github.com/anoma/namada-interface/issues/1702)) ([2b4703b](https://github.com/anoma/namada-interface/commit/2b4703b03e7ffff6d2c04f9fef0f8a420f7fb532))
* Filtering for non-zero transparent tokens ([#1705](https://github.com/anoma/namada-interface/issues/1705)) ([4b59091](https://github.com/anoma/namada-interface/commit/4b5909118932b92ddd96d1a8b40a9b25904084c2))


### Bug Fixes

* Fix duplicated notifications ([#1667](https://github.com/anoma/namada-interface/issues/1667)) ([7166417](https://github.com/anoma/namada-interface/commit/7166417f64253d2e000030d445f87e71de8a4025))
* General fixes on IBC Withdrawal, notifications and TransferModule ([#1701](https://github.com/anoma/namada-interface/issues/1701)) ([669fc15](https://github.com/anoma/namada-interface/commit/669fc15cf80d6de8a276f4bdd05b6f43ed96774b))
* Remove trailing period on urls ([#1684](https://github.com/anoma/namada-interface/issues/1684)) ([1cfb9ca](https://github.com/anoma/namada-interface/commit/1cfb9caf5b904ce42f303888a5bfcb1b9e6370b9))
* Truncate long token names in Select Asset modal ([#1694](https://github.com/anoma/namada-interface/issues/1694)) ([cb7d2ae](https://github.com/anoma/namada-interface/commit/cb7d2ae7720e8aedf29851f80351c5d9f5471d4c))
* Updating docker & nginx configs for multicore ([#1620](https://github.com/anoma/namada-interface/issues/1620)) ([0ca9c04](https://github.com/anoma/namada-interface/commit/0ca9c04ca6b2ca0130d1a5e51946fdab0bf02f8a))

## [1.10.2](https://github.com/anoma/namada-interface/compare/namadillo@v1.10.1...namadillo@v1.10.2) (2025-02-20)


### Bug Fixes

* Bumping namada keychain version (0.4.0) and fixing required indexer version (2.0.x) ([#1688](https://github.com/anoma/namada-interface/issues/1688)) ([6efe66e](https://github.com/anoma/namada-interface/commit/6efe66e81a10675abb44758f8f4cdc2d9c956d8b))

## [1.10.1](https://github.com/anoma/namada-interface/compare/namadillo@v1.10.0...namadillo@v1.10.1) (2025-02-20)


### Bug Fixes

* Bumping indexer version to 2.0.0 ([#1682](https://github.com/anoma/namada-interface/issues/1682)) ([ad31626](https://github.com/anoma/namada-interface/commit/ad31626d2476c7f22d2ffc0490803a11a6195136))

## [1.10.0](https://github.com/anoma/namada-interface/compare/namadillo@v1.9.0...namadillo@v1.10.0) (2025-02-19)


### Features

* Blocking masp usage if extension is not compatible with modified-zip32 ([#1679](https://github.com/anoma/namada-interface/issues/1679)) ([a99f338](https://github.com/anoma/namada-interface/commit/a99f338773c007cd42b28d2ff9be31b18f3a7605))
* Hide shield nam button until phase 5 ([#1671](https://github.com/anoma/namada-interface/issues/1671)) ([fe0a1a0](https://github.com/anoma/namada-interface/commit/fe0a1a09a31659c45bb6a2484ca02ddadd7ea8f8))


### Bug Fixes

* Bump keychain compatibility for Namadillo ([#1676](https://github.com/anoma/namada-interface/issues/1676)) ([688700a](https://github.com/anoma/namada-interface/commit/688700aaf5179d98e54bfc80782f3f94b715f1ec))
* Revert keychain compatibility to 0.3.x ([#1680](https://github.com/anoma/namada-interface/issues/1680)) ([6d760a7](https://github.com/anoma/namada-interface/commit/6d760a7889997aa1c395b80877c362b932c2fbc5))

## [1.9.0](https://github.com/anoma/namada-interface/compare/namadillo@v1.8.0...namadillo@v1.9.0) (2025-02-18)


### Features

* Add token address as html title ([#1663](https://github.com/anoma/namada-interface/issues/1663)) ([b06a905](https://github.com/anoma/namada-interface/commit/b06a905f7d8a521225e7b91d67cefcbb41e9eb34))
* Adding bug report button and template ([#1656](https://github.com/anoma/namada-interface/issues/1656)) ([0c39da1](https://github.com/anoma/namada-interface/commit/0c39da138fba035087757ad85f766edd005cbef6))
* Service worker fetch cache ([#1644](https://github.com/anoma/namada-interface/issues/1644)) ([d8daa5b](https://github.com/anoma/namada-interface/commit/d8daa5b5352abe4c5d51e9fa378fc21f37c3ea55))
* Sorting assets on transfer module ([#1658](https://github.com/anoma/namada-interface/issues/1658)) ([c3a77ce](https://github.com/anoma/namada-interface/commit/c3a77cec0999f6c8bc30f15ec98c824475a26206))


### Bug Fixes

* Fix time remaining fraction digits ([#1668](https://github.com/anoma/namada-interface/issues/1668)) ([ec726f1](https://github.com/anoma/namada-interface/commit/ec726f1983b7cba4843e62e7d6a864fd7a29e334))
* Increasing gas usage based on max value provided by indexer ([#1647](https://github.com/anoma/namada-interface/issues/1647)) ([9ee4d08](https://github.com/anoma/namada-interface/commit/9ee4d08d6f053fd3fde63887db5f39bbeb342c8c))
* Linking bug report button to the right url ([#1659](https://github.com/anoma/namada-interface/issues/1659)) ([cb36d95](https://github.com/anoma/namada-interface/commit/cb36d9536b55cd1121d097efbd198a2ac3e58a81))
* Pending transactions ([#1662](https://github.com/anoma/namada-interface/issues/1662)) ([1918911](https://github.com/anoma/namada-interface/commit/191891108756bb2ac98c5897452851cd4d3a8481))
* Rename balance to value ([#1669](https://github.com/anoma/namada-interface/issues/1669)) ([944fc33](https://github.com/anoma/namada-interface/commit/944fc336f645243b45af261a62e95c443dac0486))

## [1.8.0](https://github.com/anoma/namada-interface/compare/namadillo@v1.7.0...namadillo@v1.8.0) (2025-02-13)


### Features

* Add shielded overview label ([#1635](https://github.com/anoma/namada-interface/issues/1635)) ([72260e8](https://github.com/anoma/namada-interface/commit/72260e85bbba8e2dac92e5a405e01ee2bfd6f33c))
* Disable nam on asset selector ([#1627](https://github.com/anoma/namada-interface/issues/1627)) ([0ccdb65](https://github.com/anoma/namada-interface/commit/0ccdb653a698af392094a5ca166d021a2704194e))
* Update shield/unshield navigation flow ([#1641](https://github.com/anoma/namada-interface/issues/1641)) ([fca8663](https://github.com/anoma/namada-interface/commit/fca86632236fe7a964c5a80562a32eef6a145ebf))


### Bug Fixes

* Fixing gas and transactions for 1.7.0 ([#1636](https://github.com/anoma/namada-interface/issues/1636)) ([9c2a1ea](https://github.com/anoma/namada-interface/commit/9c2a1ea654f418f3f0b031151046d396a9c2e98f))
* Pgf retro denom ([#1640](https://github.com/anoma/namada-interface/issues/1640)) ([70c3e27](https://github.com/anoma/namada-interface/commit/70c3e27bcce53c4066623cacfb6b055ad951dbe3))
* Rewards fee race condition ([#1628](https://github.com/anoma/namada-interface/issues/1628)) ([6c8e26b](https://github.com/anoma/namada-interface/commit/6c8e26bfbccdf263fc3075e441b0f610d1bbbd48))

## [1.7.0](https://github.com/anoma/namada-interface/compare/namadillo@v1.6.0...namadillo@v1.7.0) (2025-02-11)


### Features

* Add dollar support for multiple channels ([#1609](https://github.com/anoma/namada-interface/issues/1609)) ([893f85e](https://github.com/anoma/namada-interface/commit/893f85ec646476b3a3851d5d250491f400aef595))
* Add optimistic response for shielded transfers ([#1615](https://github.com/anoma/namada-interface/issues/1615)) ([a27e004](https://github.com/anoma/namada-interface/commit/a27e0042a11ac9b3325cd6b6bf42959c6dcc3284))
* Render claim error ([#1626](https://github.com/anoma/namada-interface/issues/1626)) ([9f70e35](https://github.com/anoma/namada-interface/commit/9f70e358022feda17e300e0b79b7525893e20571))
* Several improvements on Transfer Module and transaction receipts ([#1617](https://github.com/anoma/namada-interface/issues/1617)) ([1f0bda8](https://github.com/anoma/namada-interface/commit/1f0bda8fddaf998dc142458dfb9373fb6734b497))
* Shielded sync before masp tx ([#1623](https://github.com/anoma/namada-interface/issues/1623)) ([56fbf56](https://github.com/anoma/namada-interface/commit/56fbf563c8654966cf4e5da90de5031130beb1ff))


### Bug Fixes

* Fixing ibc assets transfer fees ([#1625](https://github.com/anoma/namada-interface/issues/1625)) ([3185448](https://github.com/anoma/namada-interface/commit/3185448c538a57e58a07af37cdb91ba60e3d7a69))

## [1.6.0](https://github.com/anoma/namada-interface/compare/namadillo@v1.5.0...namadillo@v1.6.0) (2025-02-05)


### Features

* Add shielded balance pulse animation ([#1604](https://github.com/anoma/namada-interface/issues/1604)) ([7fb9b0a](https://github.com/anoma/namada-interface/commit/7fb9b0acd363163483926c4ec4e0ff832edac322))
* Check for ibc timeout if a response was not provided by the chain ([#1592](https://github.com/anoma/namada-interface/issues/1592)) ([9850a1c](https://github.com/anoma/namada-interface/commit/9850a1c16baacac06f89d060a2d8deeeb9af9231))
* Improving masp transactions feedback for users and other gas estimation fixes ([#1594](https://github.com/anoma/namada-interface/issues/1594)) ([426dbd3](https://github.com/anoma/namada-interface/commit/426dbd364bafcfc8788fd76054104af8fb685f22))
* Shielded rewards intergration ([#1378](https://github.com/anoma/namada-interface/issues/1378)) ([622044d](https://github.com/anoma/namada-interface/commit/622044de6a20cb673803eadf1330ccb18b9ae903))
* Update shield sync indicator layout ([#1601](https://github.com/anoma/namada-interface/issues/1601)) ([9baea53](https://github.com/anoma/namada-interface/commit/9baea5329cbdad757e189a6a5dc4bb28246592e0))


### Bug Fixes

* Disposable gas payer timeout & ibc shielding with multicore ([#1593](https://github.com/anoma/namada-interface/issues/1593)) ([a1cb27a](https://github.com/anoma/namada-interface/commit/a1cb27a26c0bbad3e558c4bcec37305cf0602083))
* Empty reward storage ([#1600](https://github.com/anoma/namada-interface/issues/1600)) ([f9074e9](https://github.com/anoma/namada-interface/commit/f9074e92d2411ca2f073395a03bdd37516b18b27))
* Fix duplicated broadcast ([#1606](https://github.com/anoma/namada-interface/issues/1606)) ([897596c](https://github.com/anoma/namada-interface/commit/897596c1d05aaf8e7fba5c730a778b95fb7d0128))
* Fixing gas estimate on IBC transfers ([#1607](https://github.com/anoma/namada-interface/issues/1607)) ([be1e7d7](https://github.com/anoma/namada-interface/commit/be1e7d7665d43ca81cc4eeefb62cf9fdc35552de))
* Fixing remaining amount calculation if gas token is different ([#1610](https://github.com/anoma/namada-interface/issues/1610)) ([de6cfe3](https://github.com/anoma/namada-interface/commit/de6cfe39b3eb25bda8a02da4a732de35ad590106))

## [1.5.0](https://github.com/anoma/namada-interface/compare/namadillo@v1.4.1...namadillo@v1.5.0) (2025-01-27)


### Features

* Add gas selector ([#1585](https://github.com/anoma/namada-interface/issues/1585)) ([8cacded](https://github.com/anoma/namada-interface/commit/8cacded71493cad31d91efb6773ab471350035e4))
* Add the possibility of overriding button error texts ([#1584](https://github.com/anoma/namada-interface/issues/1584)) ([58bb84d](https://github.com/anoma/namada-interface/commit/58bb84de75e2e159e633e369ace87b48303fdaf5))
* Fixing ibc transfers gas estimate ([#1567](https://github.com/anoma/namada-interface/issues/1567)) ([c231522](https://github.com/anoma/namada-interface/commit/c231522290019c657b50a1d4d0ae2a1100af624e))
* Improvements on IBC withdrawal ([#1574](https://github.com/anoma/namada-interface/issues/1574)) ([ba94c23](https://github.com/anoma/namada-interface/commit/ba94c23aef5946e8e5110b5b46926dbc218244f1))
* Improving masp loading states ([#1583](https://github.com/anoma/namada-interface/issues/1583)) ([9879db0](https://github.com/anoma/namada-interface/commit/9879db0c5fcfa304d4e5421bcf2f312634a33d17))

## [1.4.1](https://github.com/anoma/namada-interface/compare/namadillo@v1.4.0...namadillo@v1.4.1) (2025-01-16)


### Bug Fixes

* Removing newly introduced config variables ([#1565](https://github.com/anoma/namada-interface/issues/1565)) ([cc5129c](https://github.com/anoma/namada-interface/commit/cc5129c6c789d6fff88e261092e54f220f024d76))

## [1.4.0](https://github.com/anoma/namada-interface/compare/namadillo@v1.3.0...namadillo@v1.4.0) (2025-01-15)


### Features

* Add version warning banner (anoma[#1491](https://github.com/anoma/namada-interface/issues/1491)) ([#1534](https://github.com/anoma/namada-interface/issues/1534)) ([02cd5eb](https://github.com/anoma/namada-interface/commit/02cd5eb3413c64d18b62b93f94d1ba7c7187bddb))
* Fetch shielded balances on transfer ([#1547](https://github.com/anoma/namada-interface/issues/1547)) ([61107fc](https://github.com/anoma/namada-interface/commit/61107fc46942021b657d675a3a4ee82b8c7124fb))
* Fetching known ibc channels from github chain-registry repository ([#1545](https://github.com/anoma/namada-interface/issues/1545)) ([1e528c8](https://github.com/anoma/namada-interface/commit/1e528c815efb18659304e52f4f5dad228005f1bf))


### Bug Fixes

* Fix fee component on transfers ([#1548](https://github.com/anoma/namada-interface/issues/1548)) ([83228bf](https://github.com/anoma/namada-interface/commit/83228bfbcea6f4a35873791b5bc728116efe0f14))

## [1.3.0](https://github.com/anoma/namada-interface/compare/namadillo@v1.2.0...namadillo@v1.3.0) (2025-01-14)


### Features

* Listen for the transfer success event ([#1490](https://github.com/anoma/namada-interface/issues/1490)) ([41b7158](https://github.com/anoma/namada-interface/commit/41b7158e2e2c804234935e42bc9a07df1fb1c000))

## [1.2.0](https://github.com/anoma/namada-interface/compare/namadillo-v1.1.13...namadillo@v1.2.0) (2025-01-14)

- First release using release-please
