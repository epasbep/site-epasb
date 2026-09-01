// =====================================================
// Mapa da rede de agências e pontos de atendimento EPASB
// Depende da biblioteca Leaflet (carregada no index.html)
// =====================================================

document.addEventListener('DOMContentLoaded', function () {

  var mapEl = document.getElementById('epasbMap');
  if (!mapEl || typeof L === 'undefined') return;

  // Dados extraídos da lista de pontos/locais e zonas de agrupamento
  var zones = [
    {
      nome: "Baía Farta",
      cor: "#0077B6",
      coords: [-12.6742, 13.3722],
      pontos: ["Agência da Baía Farta"]
    },
    {
      nome: "Benguela",
      cor: "#001F33",
      coords: [-12.5763, 13.4055],
      pontos: ["Zona A", "Zona C", "Zona D", "Zona E", "Zona F", "Centro empresarial Sul"]
    },
    {
      nome: "Catumbela",
      cor: "#40ADC8",
      coords: [-12.4333, 13.5333],
      pontos: ["Vila da Catumbela", "Luongo Vimbalambi", "Agência Alto Niva", "Agência Acala"]
    },
    {
      nome: "Lobito",
      cor: "#48CAD9",
      coords: [-12.3481, 13.5456],
      pontos: [
        "Agência antiga do 28", "Agência Sede Canata", "Agência Nova do 28",
        "Agência Centralidade do Lobito", "Agência Centralidade do Luongo",
        "Agência Bela Vista", "Agência 27 de março", "Agência Alto Esperança"
      ]
    },
    {
      nome: "Navegantes",
      cor: "#0096C7",
      coords: [-12.3612, 13.5231],
      pontos: ["Zona B R3", "Zona B EE6", "Agência das Bacias de Oxidação"]
    },
    {
      nome: "Zona Norte (Lobito) — Balombo",
      cor: "#F4A300",
      coords: [-12.3667, 14.7667],
      pontos: ["Balombo"]
    },
    {
      nome: "Zona Norte (Lobito) — Bocoio",
      cor: "#F4A300",
      coords: [-12.4667, 14.4000],
      pontos: ["Bocoio"]
    },
    {
      nome: "Zona Sul (Benguela) — Caimbambo",
      cor: "#E07A00",
      coords: [-12.9333, 13.9667],
      pontos: ["Caimbambo"]
    },
    {
      nome: "Zona Sul (Benguela) — Ganda",
      cor: "#E07A00",
      coords: [-13.0167, 14.6667],
      pontos: ["Ganda"]
    },
    {
      nome: "Zona Sul (Benguela) — Cubal",
      cor: "#E07A00",
      coords: [-13.0500, 14.2500],
      pontos: ["Cubal"]
    },
    {
      nome: "Zona Sul (Benguela) — Chongoroi",
      cor: "#E07A00",
      coords: [-12.5833, 13.9667],
      pontos: ["Chongoroi"]
    }
  ];

  var map = L.map('epasbMap', { scrollWheelZoom: false }).setView([-12.75, 14.0], 8);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  function makeIcon(cor) {
    return L.divIcon({
      className: '',
      html: '<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;background:' + cor +
        ';transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);"></div>',
      iconSize: [22, 22],
      iconAnchor: [11, 22],
      popupAnchor: [0, -20]
    });
  }

  var markers = {};

  zones.forEach(function (z) {
    var listHtml = z.pontos.map(function (p) { return '<li>' + p + '</li>'; }).join('');
    var popupHtml = '<p class="epasb-popup-title">' + z.nome + '</p><ul class="epasb-popup-list">' + listHtml + '</ul>';
    var marker = L.marker(z.coords, { icon: makeIcon(z.cor) })
      .addTo(map)
      .bindPopup(popupHtml);
    markers[z.nome] = marker;
  });

  // Lista lateral de zonas
  var zoneList = document.getElementById('epasbZoneList');
  if (zoneList) {
    zones.forEach(function (z) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'epasb-zone-btn';
      btn.innerHTML =
        '<span class="epasb-dot" style="background:' + z.cor + '"></span>' +
        '<span>' + z.nome + '</span>' +
        '<span class="epasb-zone-count">' + z.pontos.length + '</span>';
      btn.addEventListener('click', function () {
        document.querySelectorAll('.epasb-zone-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        map.flyTo(z.coords, 12, { duration: 0.8 });
        markers[z.nome].openPopup();
      });
      zoneList.appendChild(btn);
    });
  }

  // Corrige o mapa caso comece dentro de um elemento ainda invisível (ex. menu mobile aberto)
  setTimeout(function () { map.invalidateSize(); }, 300);

});