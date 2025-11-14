import React from 'react';
import { 
  Modal, 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet 
} from 'react-native';

interface QuickViewModalProps {
  visible: boolean;
  onClose: () => void;
  product?: {
    id: string;
    name: string;
    description?: string;
    price: number;
    imageUrl: string;
  };
  onAddToCart?: (productId: string) => void;
}

/**
 * QuickViewModal provides a quick preview of product details without navigation.
 * Allows users to quickly view product info and add to cart.
 */
export function QuickViewModal({ 
  visible, 
  onClose, 
  product,
  onAddToCart 
}: QuickViewModalProps) {
  if (!product) {
    return null;
  }

  const handleAddToCart = () => {
    onAddToCart?.(product.id);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          
          <ScrollView style={styles.content}>
            <Image 
              source={{ uri: product.imageUrl }} 
              style={styles.image}
              resizeMode="cover"
            />
            
            <View style={styles.details}>
              <Text style={styles.name}>{product.name}</Text>
              
              {product.description && (
                <Text style={styles.description}>{product.description}</Text>
              )}
              
              <Text style={styles.price}>${product.price.toFixed(2)}</Text>
              
              <TouchableOpacity 
                style={styles.addButton}
                onPress={handleAddToCart}
              >
                <Text style={styles.addButtonText}>Add to Cart</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: 300,
    backgroundColor: '#f0f0f0',
  },
  details: {
    padding: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    lineHeight: 24,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
