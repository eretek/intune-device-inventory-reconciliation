/*! Eretek Online Araçlar #37 — Intune ve Windows Cihaz Envanteri Karşılaştırıcı */
ERT.def('37', {
	run: function (v, c) {
		var A = v.ad ? c.csv(v.ad, 'ad', 100000) : null, E = c.csv(v.entra, 'entra', 100000), N = v.intune ? c.csv(v.intune, 'intune', 100000) : null;
		var col = function (r, n, f) { var i = ERT.csv.col(r.head, n); if (i < 0) { throw c.fe(f, 'col', { c: n[0] }); } return i; };
		var eN = col(E, ['displayName', 'name', 'devicename'], 'entra'), eI = col(E, ['deviceId', 'azureADDeviceId', 'id'], 'entra');
		var byId = new Map(), byName = new Map(), dev = [];
		E.rows.forEach(function (r) { var o = { name: r[eN], id: (r[eI] || '').toLowerCase(), ad: false, intune: false, how: [] }; dev.push(o); if (o.id) { byId.set(o.id, o); } var k = ERT.norm(o.name); (byName.get(k) || byName.set(k, []).get(k)).push(o); });
		var extra = [];
		if (N) {
			var nN = col(N, ['deviceName', 'name'], 'intune'), nI = col(N, ['azureADDeviceId', 'deviceId', 'aadDeviceId'], 'intune'), nS = ERT.csv.col(N.head, ['serialNumber', 'serial']);
			N.rows.forEach(function (r) {
				var id = (r[nI] || '').toLowerCase(), o = id && byId.get(id);
				if (o) { o.intune = true; o.how.push('Intune↔Entra: deviceId'); if (nS >= 0) { o.serial = r[nS]; } }
				else { extra.push({ name: r[nN], src: 'Intune', why: id ? c.t('noEntraId') : c.t('noId') }); }
			});
		}
		if (A) {
			var aN = col(A, ['Name', 'cn', 'computerName', 'dNSHostName'], 'ad');
			A.rows.forEach(function (r) {
				var nm = String(r[aN] || '').split('.')[0], list = byName.get(ERT.norm(nm)) || [];
				if (list.length === 1) { list[0].ad = true; list[0].how.push('AD↔Entra: ' + c.t('byName')); list[0].prob = true; }
				else if (list.length > 1) { list.forEach(function (o) { o.amb = true; }); extra.push({ name: nm, src: 'AD', why: c.t('ambiguous', { n: list.length }) }); }
				else { extra.push({ name: nm, src: 'AD', why: c.t('noEntraName') }); }
			});
		}
		var rows = [], cls = [], amb = 0;
		dev.forEach(function (o) {
			var cp = []; if (o.intune) { cp.push('Intune: ' + c.t('c_cert')); } if (o.amb) { cp.push('AD: ' + c.t('c_amb')); } else if (o.prob) { cp.push('AD: ' + c.t('c_prob')); } var cert = cp.join('; ') || '–';
			if (o.amb) { amb++; }
			rows.push([o.name, o.id || '–', A ? c.yn(o.ad) : '–', N ? c.yn(o.intune) : '–', o.serial || '–', o.how.join('; ') || '–', cert]);
			cls.push(o.amb ? 'warn' : ((N && !o.intune) || (A && !o.ad) ? 'warn' : ''));
		});
		extra.forEach(function (x) { rows.push([x.name, '–', x.src === 'AD' ? c.t('yes') : '–', x.src === 'Intune' ? c.t('yes') : '–', '–', x.why, c.t('c_none')]); cls.push('err'); });
		var cols = [c.t('c_name'), 'Entra deviceId', 'AD', 'Intune', c.t('c_serial'), c.t('c_how'), c.t('c_certH')];
		return { big: c.t('big', { n: dev.length, x: extra.length }), msgs: [['info', c.t('nameNote')]].concat(amb ? [['warn', c.t('ambMsg', { n: amb })]] : []), tables: [{ cols: cols, rows: rows, cls: cls }], x: { csv: { name: 'device-reconciliation', cols: cols, rows: rows } }, v: { ambiguous: amb, unmatched: extra.length } };
	}
});
