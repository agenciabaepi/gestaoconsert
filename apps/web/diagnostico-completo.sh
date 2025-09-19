#!/bin/bash

echo "🔍 DIAGNÓSTICO COMPLETO - Vamos encontrar o problema"

echo "1. 📊 Status dos serviços:"
systemctl status nginx --no-pager -l
echo ""
systemctl status docker --no-pager -l
echo ""

echo "2. 🔌 Portas em uso:"
netstat -tlnp | grep :80
netstat -tlnp | grep :443
netstat -tlnp | grep :3001
echo ""

echo "3. 🐳 Containers Docker:"
docker ps -a
echo ""

echo "4. 📝 Configuração Nginx:"
nginx -t
echo ""
cat /etc/nginx/sites-enabled/gestaoconsert
echo ""

echo "5. 📋 Logs Nginx (últimas 20 linhas):"
tail -20 /var/log/nginx/error.log
echo ""
tail -20 /var/log/nginx/access.log
echo ""

echo "6. 🔍 Teste conectividade app:"
curl -v http://localhost:3001 || echo "App não responde na 3001"
echo ""

echo "7. 📂 Aplicação funcionando:"
cd /opt/gestaoconsert
ls -la
echo ""
docker-compose -f docker-compose-temp.yml logs app --tail=10
echo ""

echo "8. 🧪 Teste manual nginx:"
curl -v http://localhost:80 || echo "Nginx não responde na 80"
echo ""

echo "9. 🔐 Certificados SSL:"
ls -la /etc/letsencrypt/live/gestaoconsert.com.br/
echo ""

echo "10. 🌐 Teste externo:"
curl -I https://www.gestaoconsert.com.br || echo "Site não responde externamente"
echo ""

echo "✅ DIAGNÓSTICO CONCLUÍDO!"
echo ""
echo "🔧 PRÓXIMOS PASSOS:"
echo "1. Se app não responde na 3001 -> problema no Docker"
echo "2. Se nginx não responde na 80 -> problema no nginx"
echo "3. Se logs mostram erro -> corrigir configuração"
echo "4. Se certificado não existe -> reconfigurar SSL"
