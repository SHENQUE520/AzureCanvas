// Publish Item Modal Logic

export const submit_login = function () {
    // 注意：这里要确保获取的表单 ID 与你 trade.html 里的一致
    const formElement = document.getElementById('publish-form') || document.getElementById('publishForm');
    
    if(!formElement) return;

    formElement.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('itemTitle').value;
        const category = document.getElementById('itemCategory').value;
        const description = document.getElementById('itemDescription').value;
        const price = parseFloat(document.getElementById('itemPrice').value);
        const condition = parseInt(document.getElementById('itemCondition').value);
        const location = document.getElementById('itemLocation').value;
        
        // 👇👇 新增：获取隐藏的地图坐标 👇👇
        const latVal = document.getElementById('itemLat').value;
        const lngVal = document.getElementById('itemLng').value;
        const lat = latVal ? parseFloat(latVal) : null;
        const lng = lngVal ? parseFloat(lngVal) : null;
        // 👆👆 新增结束 👆👆

        const isUrgent = document.getElementById('isUrgent').checked;
        const isShippingFree = document.getElementById('isShippingFree').checked;
        const canInspect = document.getElementById('canInspect').checked;

        if (!title || !category || !description || isNaN(price) || isNaN(condition)) {
            window.notify.show('请填写所有必填项！', 'warning');
            return;
        }

        try {
            const response = await fetch('/api/market/items', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': window.getCsrfToken()
                },
                body: JSON.stringify({
                    title: title,
                    category: category,
                    description: description,
                    price: price,
                    condition: condition, 
                    location: location,
                    lat: lat, // <-- 发送纬度给后端
                    lng: lng, // <-- 发送经度给后端
                    isUrgent: isUrgent, 
                    isShippingFree: isShippingFree, 
                    canInspect: canInspect, 
                    images: [] 
                })
            });

            if (response.ok) {
                window.notify.show('商品上架成功！', 'success');
                if (typeof closePublish === 'function') closePublish();
                formElement.reset();
                
                // 提交成功后顺便清空隐藏的坐标，并把地图收起
                document.getElementById('itemLat').value = '';
                document.getElementById('itemLng').value = '';
                const mapContainer = document.getElementById('mini-map-container');
                if (mapContainer) mapContainer.classList.add('hidden');
                
            } else {
                const errorData = await response.json();
                window.notify.show(`上架失败: ${errorData.message || response.statusText}`, 'error');
            }
        } catch (error) {
            console.error('Error submitting item:', error);
            window.notify.show('网络错误，上架失败。', 'error');
        }
    });
}