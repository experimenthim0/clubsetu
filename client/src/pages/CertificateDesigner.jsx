import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';

const CertificateDesigner = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Canvas State
  const canvasRef = useRef(null);
  const [image, setImage] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [rect, setRect] = useState(null); // { x, y, w, h } in canvas coords

  // Template Config
  const [imageUrl, setImageUrl] = useState('');
  const [fontSize, setFontSize] = useState(32);
  const [color, setColor] = useState('#000000');
  const [font, setFont] = useState('DancingScript');
  const [align, setAlign] = useState('center');
  const [fontMenuOpen, setFontMenuOpen] = useState(false);

  // Constants
  const PDF_W = 841.89;
  const PDF_H = 595.28;

  const FONTS = [
    { id: 'DancingScript', label: 'Dancing Script', style: { fontFamily: "'Dancing Script', cursive" } },
    { id: 'GreatVibes', label: 'Great Vibes', style: { fontFamily: "'Great Vibes', cursive" } },
    { id: 'Pacifico', label: 'Pacifico', style: { fontFamily: "'Pacifico', cursive" } },
    { id: 'Sacramento', label: 'Sacramento', style: { fontFamily: "'Sacramento', cursive" } },
    { id: 'Allura', label: 'Allura', style: { fontFamily: "'Allura', cursive" } },
    { id: 'PinyonScript', label: 'Pinyon Script', style: { fontFamily: "'Pinyon Script', cursive" } },
    { id: 'Helvetica-Bold', label: 'Helvetica Bold', style: { fontWeight: 'bold' } },
    { id: 'Helvetica', label: 'Helvetica Regular', style: {} },
    { id: 'Times-Bold', label: 'Times Bold', style: { fontFamily: 'serif', fontWeight: 'bold' } },
    { id: 'Times-Roman', label: 'Times Regular', style: { fontFamily: 'serif' } },
  ];

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/events/${id}`);
      setEvent(res.data);
      if (res.data.certificateTemplate) {
        const t = res.data.certificateTemplate;
        setImageUrl(t.imageUrl || '');
        setFontSize(t.fontSize || 32);
        setColor(t.color || '#000000');
        setFont(t.font || 'DancingScript');
        setAlign(t.align || 'center');
        
        if (t.imageUrl) {
          loadBackgroundImage(t.imageUrl, t);
        }
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      showNotification('Failed to load event details', 'error');
      setLoading(false);
    }
  };

  const loadBackgroundImage = (url, template = null) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImage(img);
      
      // If we have existing template coords, calculate the rect for the canvas
      if (template && template.nameWidth) {
        const containerWidth = canvasRef.current?.parentElement?.clientWidth || img.naturalWidth;
        const scale = Math.min(1, containerWidth / img.naturalWidth);
        const r = {
          x: template.nameX * scale,
          y: template.nameY * scale,
          w: template.nameWidth * scale,
          h: template.nameHeight * scale
        };
        setRect(r);
        renderCanvas(img, r);
      } else {
        renderCanvas(img);
      }
    };
    img.src = url;
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Use internal server proxy to upload to Cloudinary securely
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/certificates/upload-template`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      const { secure_url } = res.data;
      setImageUrl(secure_url);
      loadBackgroundImage(secure_url);
      showNotification('Template uploaded successfully!', 'success');
    } catch (err) {
      console.error(err);
      showNotification(`Upload Error: ${err.response?.data?.message || err.message}`, 'error');
    } finally {
      setUploading(false);
    }
  };

  const renderCanvas = (img, currentRect = null) => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    const containerWidth = canvas.parentElement.clientWidth;
    const scale = Math.min(1, containerWidth / img.naturalWidth);
    
    canvas.width = img.naturalWidth * scale;
    canvas.height = img.naturalHeight * scale;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    if (currentRect) {
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      ctx.strokeRect(currentRect.x, currentRect.y, currentRect.w, currentRect.h);
      ctx.fillStyle = 'rgba(249, 115, 22, 0.1)';
      ctx.fillRect(currentRect.x, currentRect.y, currentRect.w, currentRect.h);

      // Center line
      const midY = currentRect.y + currentRect.h / 2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(currentRect.x, midY);
      ctx.lineTo(currentRect.x + currentRect.w, midY);
      ctx.stroke();
    }
  };

  const getPos = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - r.left, y: clientY - r.top };
  };

  const handleMouseDown = (e) => {
    if (!image) return;
    const pos = getPos(e);
    setIsDrawing(true);
    setStartPos(pos);
    setRect(null);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !image) return;
    const pos = getPos(e);
    const currentRect = {
      x: Math.min(pos.x, startPos.x),
      y: Math.min(pos.y, startPos.y),
      w: Math.abs(pos.x - startPos.x),
      h: Math.abs(pos.y - startPos.y)
    };
    renderCanvas(image, currentRect);
  };

  const handleMouseUp = (e) => {
    if (!isDrawing || !image) return;
    setIsDrawing(false);
    const pos = getPos(e);
    const finalRect = {
      x: Math.min(pos.x, startPos.x),
      y: Math.min(pos.y, startPos.y),
      w: Math.abs(pos.x - startPos.x),
      h: Math.abs(pos.y - startPos.y)
    };

    if (finalRect.w < 10 || finalRect.h < 10) {
      setRect(null);
      renderCanvas(image);
    } else {
      setRect(finalRect);
      renderCanvas(image, finalRect);
    }
  };

  const handleSave = async () => {
    if (!imageUrl) return showNotification('Please upload a template first', 'warning');
    if (!rect) return showNotification('Please draw a box for the name placeholder', 'warning');

    setSaving(true);
    
    // Calculate coordinates based on the image's NATURAL pixels
    const canvas = canvasRef.current;
    const scaleX = image.naturalWidth / canvas.width;
    const scaleY = image.naturalHeight / canvas.height;

    const payload = {
      imageUrl,
      nameX: Math.round(rect.x * scaleX),
      nameY: Math.round(rect.y * scaleY),
      nameWidth: Math.round(rect.w * scaleX),
      nameHeight: Math.round(rect.h * scaleY),
      imageWidth: image.naturalWidth,
      imageHeight: image.naturalHeight,
      fontSize,
      color,
      font,
      align
    };

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/certificates/${id}/template`, payload);
      showNotification('Certificate template saved successfully!', 'success');
      navigate('/my-events');
    } catch (err) {
      console.error(err);
      showNotification(err.response?.data?.message || 'Failed to save template', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center font-bold">Loading Designer...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-4 border-black shadow-[12px_12px_0px_#000] p-6 mb-10"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-black uppercase italic tracking-tighter">Certificate Designer</h1>
            <p className="text-neutral-500 font-bold uppercase text-xs tracking-widest">{event?.title}</p>
          </div>
          <button 
            onClick={() => navigate('/my-events')}
            className="px-4 py-2 bg-neutral-100 border-2 border-black font-black text-xs uppercase tracking-widest hover:bg-neutral-200 transition-all"
          >
            Cancel
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Controls */}
          <div className="space-y-6">
             <div className="bg-orange-50 border-2 border-orange-600 p-4 rounded-lg">
                <h3 className="font-bold text-orange-600 uppercase text-xs tracking-widest mb-2">Step 1: Upload Template</h3>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload}
                  className="w-full text-xs font-bold uppercase file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-2 file:border-black file:text-xs file:font-black file:bg-white hover:file:bg-orange-100 cursor-pointer"
                />
                {uploading && <p className="text-[10px] mt-2 font-black animate-pulse">Uploading to cloud...</p>}
             </div>

             <div className="bg-neutral-50 border-2 border-black p-4 rounded-lg space-y-4">
                <h3 className="font-bold uppercase text-xs tracking-widest mb-2">Step 2: Customize Text</h3>
                
                <div>
                  <label className="block text-[10px] font-black uppercase mb-1">Font Style</label>
                  <div className="relative">
                    <button
                      onClick={() => setFontMenuOpen(!fontMenuOpen)}
                      className="w-full p-3 border-2 border-black font-bold flex justify-between items-center bg-white hover:bg-neutral-50 transition-all"
                      style={FONTS.find(f => f.id === font)?.style}
                    >
                      <span className="text-lg">{FONTS.find(f => f.id === font)?.label}</span>
                      <i className={`ri-arrow-down-s-line transition-transform duration-300 ${fontMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {fontMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-10 w-full mt-1 border-2 border-black bg-white shadow-[4px_4px_0px_#000] max-h-[250px] overflow-y-auto scrollbar-thin scrollbar-thumb-black"
                        >
                          {FONTS.map(f => (
                            <button
                              key={f.id}
                              onClick={() => { setFont(f.id); setFontMenuOpen(false); }}
                              className={`w-full p-3 text-left hover:bg-orange-50 transition-all border-b border-neutral-100 last:border-0 ${font === f.id ? 'bg-orange-50 font-black' : ''}`}
                              style={f.style}
                            >
                              <span className="text-lg">{f.label}</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase mb-1">Size</label>
                    <input 
                      type="number" 
                      value={fontSize} 
                      onChange={(e) => setFontSize(e.target.value)}
                      className="w-full p-2 border-2 border-black font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase mb-1">Color</label>
                    <input 
                      type="color" 
                      value={color} 
                      onChange={(e) => setColor(e.target.value)}
                      className="w-full h-10 p-1 border-2 border-black cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase mb-1">Alignment</label>
                  <div className="flex border-2 border-black overflow-hidden">
                    {['left', 'center', 'right'].map(a => (
                      <button
                        key={a}
                        onClick={() => setAlign(a)}
                        className={`flex-1 py-1 text-[10px] font-black uppercase transition-all ${align === a ? 'bg-black text-white' : 'bg-white text-black hover:bg-neutral-100'}`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
             </div>

             <button
              onClick={handleSave}
              disabled={saving || !imageUrl || !rect}
              className={`w-full py-4 border-4 border-black font-black uppercase tracking-widest text-sm shadow-[4px_4px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all ${saving || !imageUrl || !rect ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed' : 'bg-orange-600 text-white hover:bg-orange-700'}`}
             >
                {saving ? 'Saving...' : 'Save Template'}
             </button>
          </div>

          {/* Canvas Area */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative border-4 border-black bg-neutral-100 min-h-[400px] flex items-center justify-center overflow-auto shadow-[4px_4px_0px_#000]">
              {!imageUrl ? (
                <div className="text-center p-10">
                  <i className="ri-image-add-line text-6xl text-neutral-300 block mb-4" />
                  <p className="text-xs font-black uppercase text-neutral-400">Upload a background template to start</p>
                </div>
              ) : (
                <canvas 
                  ref={canvasRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onTouchStart={handleMouseDown}
                  onTouchMove={handleMouseMove}
                  onTouchEnd={handleMouseUp}
                  className="cursor-crosshair block shadow-2xl"
                />
              )}
            </div>
            <div className="flex justify-between items-center px-2">
              <p className="text-[10px] font-black uppercase text-neutral-500">
                {rect ? `Box: ${rect.w}x${rect.h} at ${rect.x},${rect.y}` : 'Click and drag to draw name placeholder'}
              </p>
              {rect && (
                <button 
                  onClick={() => { setRect(null); renderCanvas(image); }}
                  className="text-[10px] font-black text-red-600 uppercase hover:underline"
                >
                  Clear Box
                </button>
              )}
            </div>

            {/* Preview Hint */}
            <AnimatePresence>
              {rect && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  className="bg-yellow-50 border-2 border-yellow-600 p-4 rounded-sm flex items-center gap-3"
                >
                  <i className="ri-lightbulb-line text-yellow-600 text-xl" />
                  <p className="text-[11px] font-bold text-yellow-800 leading-tight">
                    The student's name will appear inside this box using <span className="font-italic" style={{ fontFamily: FONTS.find(f => f.id === font)?.style?.fontFamily }}>{FONTS.find(f => f.id === font)?.label}</span> font.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CertificateDesigner;
