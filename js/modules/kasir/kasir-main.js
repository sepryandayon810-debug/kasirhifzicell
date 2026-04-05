     1	/**
     2	 * WebPOS Kasir Main Module v2.0
     3	 * Features: Product loading, category filtering, search, grid/list view
     4	 */
     5	
     6	const KasirMain = (function() {
     7	    'use strict';
     8	    
     9	    // State
    10	    const state = {
    11	        produk: [],
    12	        kategori: [],
    13	        keranjang: [],
    14	        filter: {
    15	            kategori: '',
    16	            search: '',
    17	            view: 'grid'
    18	        },
    19	        isLoading: false
    20	    };
    21	    
    22	    // DOM Elements Cache
    23	    let elements = {};
    24	    
    25	    // Initialize
    26	    function init() {
    27	        cacheElements();
    28	        if (!elements.container) {
    29	            console.warn('KasirMain: Container not found');
    30	            return;
    31	        }
    32	        
    33	        loadKategori();
    34	        loadProduk();
    35	        bindEvents();
    36	        setupRealtimeListener();
    37	        
    38	        console.log('KasirMain initialized');
    39	    }
    40	    
    41	    // Cache DOM elements
    42	    function cacheElements() {
    43	        elements = {
    44	            container: document.getElementById('produk-container'),
    45	            searchInput: document.getElementById('search-produk'),
    46	            kategoriSelect: document.getElementById('filter-kategori'),
    47	            kategoriChips: document.getElementById('kategori-scroll'),
    48	            viewGrid: document.getElementById('view-grid'),
    49	            viewList: document.getElementById('view-list'),
    50	            lastUpdate: document.getElementById('last-update')
    51	        };
    52	    }
    53	    
    54	    // Load Kategori dari Firebase
    55	    function loadKategori() {
    56	        const kategoriRef = firebase.database().ref('kategori');
    57	        
    58	        kategoriRef.once('value', (snapshot) => {
    59	            state.kategori = [];
    60	            const data = snapshot.val();
    61	            
    62	            if (data) {
    63	                Object.keys(data).forEach(key => {
    64	                    state.kategori.push({
    65	                        id: key,
    66	                        nama: data[key].nama || 'Tanpa Nama',
    67	                        icon: data[key].icon || 'fa-tag'
    68	                    });
    69	                });
    70	            }
    71	            
    72	            // Add "Umum" as default if no categories
    73	            if (state.kategori.length === 0) {
    74	                state.kategori.push({ id: 'umum', nama: 'Umum', icon: 'fa-box' });
    75	            }
    76	            
    77	            renderKategoriOptions();
    78	            renderKategoriChips();
    79	        }).catch(err => {
    80	            console.error('Error loading kategori:', err);
    81	        });
    82	    }
    83	    
    84	    // Render Dropdown Kategori
    85	    function renderKategoriOptions() {
    86	        if (!elements.kategoriSelect) return;
    87	        
    88	        let html = '<option value="">Semua Kategori</option>';
    89	        
    90	        state.kategori.forEach(kat => {
    91	            html += `<option value="${kat.id}">${kat.nama}</option>`;
    92	        });
    93	        
    94	        elements.kategoriSelect.innerHTML = html;
    95	    }
    96	    
    97	    // Render Kategori Chips (Filter Cepat)
    98	    function renderKategoriChips() {
    99	        if (!elements.kategoriChips) return;
   100	        
   101	        let html = `
   102	            <button class="kategori-chip ${state.filter.kategori === '' ? 'active' : ''}" data-kategori="">
   103	                <i class="fas fa-th-large"></i>
   104	                <span>Semua</span>
   105	            </button>
   106	        `;
   107	        
   108	        state.kategori.forEach(kat => {
   109	            html += `
   110	                <button class="kategori-chip ${state.filter.kategori === kat.id ? 'active' : ''}" 
   111	                        data-kategori="${kat.id}" title="${kat.nama}">
   112	                    <i class="fas ${kat.icon}"></i>
   113	                    <span>${kat.nama}</span>
   114	                </button>
   115	            `;
   116	        });
   117	        
   118	        elements.kategoriChips.innerHTML = html;
   119	        
   120	        // Bind click events
   121	        elements.kategoriChips.querySelectorAll('.kategori-chip').forEach(chip => {
   122	            chip.addEventListener('click', function() {
   123	                const kategoriId = this.dataset.kategori;
   124	                setKategoriFilter(kategoriId);
   125	            });
   126	        });
   127	    }
   128	    
   129	    // Set Filter Kategori
   130	    function setKategoriFilter(kategoriId) {
   131	        state.filter.kategori = kategoriId;
   132	        
   133	        // Update select dropdown
   134	        if (elements.kategoriSelect) {
   135	            elements.kategoriSelect.value = kategoriId;
   136	        }
   137	        
   138	        // Update chips UI
   139	        document.querySelectorAll('.kategori-chip').forEach(chip => {
   140	            chip.classList.toggle('active', chip.dataset.kategori === kategoriId);
   141	        });
   142	        
   143	        // Apply filter dengan animasi
   144	        filterAndRender();
   145	        
   146	        // Scroll ke container produk
   147	        elements.container?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
   148	    }
   149	    
   150	    // Load Produk dari Firebase
   151	    function loadProduk() {
   152	        state.isLoading = true;
   153	        showLoading();
   154	        
   155	        const produkRef = firebase.database().ref('produk');
   156	        
   157	        produkRef.once('value', (snapshot) => {
   158	            state.produk = [];
   159	            const data = snapshot.val();
   160	            
   161	            if (data) {
   162	                Object.keys(data).forEach(key => {
   163	                    // Hanya tampilkan produk aktif
   164	                    if (data[key].status !== 'nonaktif') {
   165	                        state.produk.push({
   166	                            id: key,
   167	                            nama: data[key].nama || 'Tanpa Nama',
   168	                            kode: data[key].kode || '',
   169	                            barcode: data[key].barcode || '',
   170	                            hargaJual: parseInt(data[key].hargaJual) || 0,
   171	                            hargaModal: parseInt(data[key].hargaModal) || 0,
   172	                            stok: parseInt(data[key].stok) || 0,
   173	                            kategoriId: data[key].kategoriId || 'umum',
   174	                            gambar: data[key].gambar || null,
   175	                            satuan: data[key].satuan || 'pcs',
   176	                            minStok: parseInt(data[key].minStok) || 5
   177	                        });
   178	                    }
   179	                });
   180	            }
   181	            
   182	            state.isLoading = false;
   183	            filterAndRender();
   184	            updateLastUpdate();
   185	            
   186	        }).catch(err => {
   187	            console.error('Error loading produk:', err);
   188	            state.isLoading = false;
   189	            showError('Gagal memuat produk');
   190	        });
   191	    }
   192	    
   193	    // Filter dan Render
   194	    function filterAndRender() {
   195	        let filtered = [...state.produk];
   196	        
   197	        // Filter by kategori
   198	        if (state.filter.kategori) {
   199	            filtered = filtered.filter(p => p.kategoriId === state.filter.kategori);
   200	        }
   201	        
   202	        // Filter by search
   203	        if (state.filter.search) {
   204	            const searchLower = state.filter.search.toLowerCase().trim();
   205	            filtered = filtered.filter(p => 
   206	                p.nama.toLowerCase().includes(searchLower) ||
   207	                p.kode.toLowerCase().includes(searchLower) ||
   208	                p.barcode.toLowerCase().includes(searchLower)
   209	            );
   210	        }
   211	        
   212	        // Sort by nama
   213	        filtered.sort((a, b) => a.nama.localeCompare(b.nama));
   214	        
   215	        renderProduk(filtered);
   216	    }
   217	    
   218	    // Render Loading State
   219	    function showLoading() {
   220	        if (!elements.container) return;
   221	        elements.container.innerHTML = `
   222	            <div class="loading-produk">
   223	                <div class="spinner"></div>
   224	                <p>Memuat produk...</p>
   225	            </div>
   226	        `;
   227	    }
   228	    
   229	    // Render Error State
   230	    function showError(message) {
   231	        if (!elements.container) return;
   232	        elements.container.innerHTML = `
   233	            <div class="empty-state error">
   234	                <i class="fas fa-exclamation-circle"></i>
   235	                <p>${message}</p>
   236	                <button onclick="KasirMain.refresh()" class="btn-retry">
   237	                    <i class="fas fa-redo"></i> Coba Lagi
   238	                </button>
   239	            </div>
   240	        `;
   241	    }
   242	    
   243	    // Render Produk Grid/List
   244	    function renderProduk(produkList) {
   245	        if (!elements.container) return;
   246	        
   247	        if (produkList.length === 0) {
   248	            elements.container.innerHTML = `
   249	                <div class="empty-state">
   250	                    <i class="fas fa-box-open"></i>
   251	                    <p>Tidak ada produk</p>
   252	                    <span>${state.filter.search ? 'Coba kata kunci lain' : 'Tambahkan produk baru'}</span>
   253	                </div>
   254	            `;
   255	            return;
   256	        }
   257	        
   258	        const isGrid = state.filter.view === 'grid';
   259	        elements.container.className = `produk-container-modern ${isGrid ? 'grid-view' : 'list-view'}`;
   260	        
   261	        let html = '';
   262	        
   263	        produkList.forEach((produk, index) => {
   264	            if (isGrid) {
   265	                html += renderGridItem(produk, index);
   266	            } else {
   267	                html += renderListItem(produk, index);
   268	            }
   269	        });
   270	        
   271	        elements.container.innerHTML = html;
   272	        
   273	        // Bind events dengan delay untuk animasi
   274	        setTimeout(() => {
   275	            bindProdukEvents();
   276	        }, 50);
   277	    }
   278	    
   279	    // Render Grid Item
   280	    function renderGridItem(produk, index) {
   281	        const stok = produk.stok || 0;
   282	        const stokClass = stok <= 0 ? 'empty' : stok <= produk.minStok ? 'low' : stok <= 10 ? 'medium' : 'high';
   283	        const stokText = stok <= 0 ? 'Habis' : stok <= produk.minStok ? 'Kritis' : stok;
   284	        const isDisabled = stok <= 0;
   285	        
   286	        const kategori = state.kategori.find(k => k.id === produk.kategoriId);
   287	        const kategoriNama = kategori ? kategori.nama : 'Umum';
   288	        const kategoriIcon = kategori ? kategori.icon : 'fa-box';
   289	        
   290	        return `
   291	            <div class="produk-card-modern ${isDisabled ? 'disabled' : ''}" 
   292	                 style="animation: fadeIn 0.3s ease ${index * 0.05}s both;">
   293	                <div class="produk-image-modern">
   294	                    ${produk.gambar ? 
   295	                        `<img src="${produk.gambar}" alt="${produk.nama}" loading="lazy">` : 
   296	                        `<i class="fas ${kategoriIcon}"></i>`
   297	                    }
   298	                    <span class="stok-badge ${stokClass}">${stokText}</span>
   299	                </div>
   300	                <div class="produk-info-modern">
   301	                    <h4 class="produk-nama-modern" title="${produk.nama}">${produk.nama}</h4>
   302	                    <p class="produk-kategori-modern">
   303	                        <i class="fas fa-tag"></i> ${kategoriNama}
   304	                    </p>
   305	                    <div class="produk-meta-modern">
   306	                        <span class="produk-kode">${produk.kode || '-'}</span>
   307	                        <span class="produk-satuan">${produk.satuan}</span>
   308	                    </div>
   309	                    <div class="produk-price-modern">
   310	                        <span class="harga-jual">Rp ${formatRupiah(produk.hargaJual)}</span>
   311	                        ${produk.hargaModal > 0 ? `<span class="harga-modal">Rp ${formatRupiah(produk.hargaModal)}</span>` : ''}
   312	                    </div>
   313	                </div>
   314	                <button class="btn-add-cart ${isDisabled ? 'disabled' : ''}" 
   315	                        data-id="${produk.id}" 
   316	                        ${isDisabled ? 'disabled' : ''}>
   317	                    <i class="fas fa-plus"></i>
   318	                </button>
   319	            </div>
   320	        `;
   321	    }
   322	    
   323	    // Render List Item
   324	    function renderListItem(produk, index) {
   325	        const stok = produk.stok || 0;
   326	        const isDisabled = stok <= 0;
   327	        
   328	        const kategori = state.kategori.find(k => k.id === produk.kategoriId);
   329	        const kategoriNama = kategori ? kategori.nama : 'Umum';
   330	        
   331	        return `
   332	            <div class="produk-list-item-modern ${isDisabled ? 'disabled' : ''}"
   333	                 style="animation: slideInRight 0.3s ease ${index * 0.03}s both;">
   334	                <div class="list-checkbox">
   335	                    <input type="checkbox" class="select-item" data-id="${produk.id}">
   336	                </div>
   337	                <div class="list-image">
   338	                    ${produk.gambar ? 
   339	                        `<img src="${produk.gambar}" alt="${produk.nama}" loading="lazy">` : 
   340	                        `<i class="fas fa-box"></i>`
   341	                    }
   342	                </div>
   343	                <div class="list-info">
   344	                    <h4>${produk.nama}</h4>
   345	                    <p>
   346	                        <span class="badge-kategori">${kategoriNama}</span>
   347	                        <span class="badge-stok ${stok <= 0 ? 'danger' : stok <= 5 ? 'warning' : 'success'}">
   348	                            Stok: ${stok}
   349	                        </span>
   350	                    </p>
   351	                </div>
   352	                <div class="list-price">
   353	                    <span class="price-jual">Rp ${formatRupiah(produk.hargaJual)}</span>
   354	                </div>
   355	                <button class="btn-add-cart ${isDisabled ? 'disabled' : ''}" 
   356	                        data-id="${produk.id}"
   357	                        ${isDisabled ? 'disabled' : ''}>
   358	                    <i class="fas fa-plus"></i>
   359	                </button>
   360	            </div>
   361	        `;
   362	    }
   363	    
   364	    // Bind events untuk produk items
   365	    function bindProdukEvents() {
   366	        // Add to cart buttons
   367	        document.querySelectorAll('.btn-add-cart:not(.disabled)').forEach(btn => {
   368	            btn.addEventListener('click', function(e) {
   369	                e.stopPropagation();
   370	                const produkId = this.dataset.id;
   371	                addToCart(produkId);
   372	                
   373	                // Visual feedback
   374	                this.classList.add('clicked');
   375	                setTimeout(() => this.classList.remove('clicked'), 200);
   376	            });
   377	        });
   378	        
   379	        // Card click untuk edit (opsional)
   380	        document.querySelectorAll('.produk-card-modern').forEach(card => {
   381	            card.addEventListener('click', function(e) {
   382	                if (!e.target.closest('.btn-add-cart')) {
   383	                    // Bisa tambah fitur quick view di sini
   384	                }
   385	            });
   386	        });
   387	    }
   388	    
   389	    // Add to Cart
   390	    function addToCart(produkId) {
   391	        const produk = state.produk.find(p => p.id === produkId);
   392	        if (!produk) return;
   393	        
   394	        // Cek stok
   395	        if (produk.stok <= 0) {
   396	            showToast('Stok produk habis!', 'error');
   397	            return;
   398	        }
   399	        
   400	        // Tambah ke keranjang via global Keranjang module
   401	        if (window.Keranjang && window.Keranjang.add) {
   402	            window.Keranjang.add({
   403	                id: produk.id,
   404	                nama: produk.nama,
   405	                hargaJual: produk.hargaJual,
   406	                hargaModal: produk.hargaModal,
   407	                stok: produk.stok,
   408	                gambar: produk.gambar
   409	            });
   410	            
   411	            showToast(`${produk.nama} ditambahkan`, 'success');
   412	        } else {
   413	            console.warn('Keranjang module not found');
   414	        }
   415	    }
   416	    
   417	    // Bind Events
   418	    function bindEvents() {
   419	        // Search input dengan debounce
   420	        if (elements.searchInput) {
   421	            elements.searchInput.addEventListener('input', debounce(function() {
   422	                state.filter.search = this.value;
   423	                filterAndRender();
   424	            }, 300));
   425	            
   426	            // Focus search on Ctrl+K
   427	            document.addEventListener('keydown', (e) => {
   428	                if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
   429	                    e.preventDefault();
   430	                    elements.searchInput.focus();
   431	                }
   432	            });
   433	        }
   434	        
   435	        // Kategori Select
   436	        if (elements.kategoriSelect) {
   437	            elements.kategoriSelect.addEventListener('change', function() {
   438	                setKategoriFilter(this.value);
   439	            });
   440	        }
   441	        
   442	        // View Toggle
   443	        if (elements.viewGrid) {
   444	            elements.viewGrid.addEventListener('click', () => setView('grid'));
   445	        }
   446	        if (elements.viewList) {
   447	            elements.viewList.addEventListener('click', () => setView('list'));
   448	        }
   449	        
   450	        // Listen for theme changes
   451	        window.addEventListener('themechange', () => {
   452	            // Re-render jika perlu adjust warna
   453	            filterAndRender();
   454	        });
   455	    }
   456	    
   457	    // Set View Mode
   458	    function setView(view) {
   459	        state.filter.view = view;
   460	        
   461	        elements.viewGrid?.classList.toggle('active', view === 'grid');
   462	        elements.viewList?.classList.toggle('active', view === 'list');
   463	        
   464	        // Save preference
   465	        localStorage.setItem('kasir-view-mode', view);
   466	        
   467	        filterAndRender();
   468	    }
   469	    
   470	    // Setup Realtime Listener
   471	    function setupRealtimeListener() {
   472	        const produkRef = firebase.database().ref('produk');
   473	        
   474	        produkRef.on('child_changed', (snapshot) => {
   475	            const id = snapshot.key;
   476	            const data = snapshot.val();
   477	            
   478	            // Update local data
   479	            const index = state.produk.findIndex(p => p.id === id);
   480	            if (index !== -1) {
   481	                if (data.status === 'nonaktif') {
   482	                    state.produk.splice(index, 1);
   483	                } else {
   484	                    state.produk[index] = { ...state.produk[index], ...data };
   485	                }
   486	                filterAndRender();
   487	            }
   488	        });
   489	        
   490	        produkRef.on('child_added', (snapshot) => {
   491	            loadProduk(); // Reload untuk simplicity
   492	        });
   493	        
   494	        produkRef.on('child_removed', () => {
   495	            loadProduk();
   496	        });
   497	    }
   498	    
   499	    // Helper: Format Rupiah
   500	    function formatRupiah(angka) {
   501	        if (!angka) return '0';
   502	        return angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
   503	    }
   504	    
   505	    // Helper: Debounce
   506	    function debounce(func, wait) {
   507	        let timeout;
   508	        return function executedFunction(...args) {
   509	            const later = () => {
   510	                clearTimeout(timeout);
   511	                func.apply(this, args);
   512	            };
   513	            clearTimeout(timeout);
   514	            timeout = setTimeout(later, wait);
   515	        };
   516	    }
   517	    
   518	    // Helper: Show Toast
   519	    function showToast(message, type = 'info') {
   520	        const container = document.getElementById('toast-container');
   521	        if (!container) return;
   522	        
   523	        const toast = document.createElement('div');
   524	        toast.className = `toast toast-${type}`;
   525	        toast.innerHTML = `
   526	            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
   527	            <span>${message}</span>
   528	        `;
   529	        
   530	        container.appendChild(toast);
   531	        
   532	        setTimeout(() => {
   533	            toast.classList.add('show');
   534	        }, 10);
   535	        
   536	        setTimeout(() => {
   537	            toast.classList.remove('show');
   538	            setTimeout(() => toast.remove(), 300);
   539	        }, 3000);
   540	    }
   541	    
   542	    // Update last update time
   543	    function updateLastUpdate() {
   544	        if (elements.lastUpdate) {
   545	            const now = new Date();
   546	            elements.lastUpdate.textContent = `Terakhir update: ${now.toLocaleTimeString('id-ID')}`;
   547	        }
   548	    }
   549	    
   550	    // Public API
   551	    return {
   552	        init,
   553	        refresh: loadProduk,
   554	        setKategoriFilter,
   555	        getState: () => state,
   556	        filterAndRender
   557	    };
   558	})();
   559	
   560	// Auto-init
   561	document.addEventListener('DOMContentLoaded', () => {
   562	    // Delay untuk memastikan Firebase siap
   563	    setTimeout(() => KasirMain.init(), 100);
   564	});
   565	
