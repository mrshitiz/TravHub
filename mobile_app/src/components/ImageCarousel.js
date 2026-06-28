import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Image } from 'expo-image';

export const ImageCarousel = ({ images }) => {
  const [width, setWidth] = useState(375);
  const [activeDot, setActiveDot] = useState(0);

  const handleScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const slide = Math.round(contentOffsetX / width);
    if (slide !== activeDot) {
      setActiveDot(slide);
    }
  };

  return (
    <View 
      style={{ width: '100%', aspectRatio: 1, position: 'relative' }}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      <ScrollView 
        horizontal 
        pagingEnabled 
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={{ width: '100%', height: '100%' }}
      >
        {images.map((imgUri, index) => (
          <Image 
            key={index}
            source={{ uri: imgUri }} 
            style={{ width: width, height: width }} 
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
          />
        ))}
      </ScrollView>
      {images.length > 1 && (
        <View style={{
          position: 'absolute',
          bottom: 12,
          left: 0,
          right: 0,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 6
        }}>
          {images.map((_, i) => (
            <View 
              key={i} 
              style={{
                width: i === activeDot ? 7 : 5,
                height: i === activeDot ? 7 : 5,
                borderRadius: 4,
                backgroundColor: i === activeDot ? '#0ea5e9' : 'rgba(255, 255, 255, 0.4)'
              }} 
            />
          ))}
        </View>
      )}
    </View>
  );
};
export default ImageCarousel;
