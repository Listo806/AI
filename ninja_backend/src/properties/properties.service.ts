import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Property, PropertyStatus, CreatePropertyDto, UpdatePropertyDto, PropertyMedia } from './entities/property.entity';
import { EventLoggerService } from '../analytics/events/event-logger.service';

@Injectable()
export class PropertiesService {
  constructor(
    private readonly db: DatabaseService,
    private readonly eventLogger: EventLoggerService,
  ) {}

  async create(createPropertyDto: CreatePropertyDto, userId: string, teamId: string | null): Promise<Property> {
    const status = createPropertyDto.status || PropertyStatus.DRAFT;

    const { rows } = await this.db.query(
      `INSERT INTO properties (
        title, description, address, city, state, zip_code, price, type, status,
        bedrooms, bathrooms, square_feet, lot_size, year_built, created_by, team_id,
        latitude, longitude, created_at, updated_at, published_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW(), $19)
      RETURNING id, title, description, address, city, state, zip_code as "zipCode", price, type, status,
                bedrooms, bathrooms, square_feet as "squareFeet", lot_size as "lotSize", year_built as "yearBuilt",
                created_by as "createdBy", edited_by as "editedBy", team_id as "teamId", latitude, longitude,
                created_at as "createdAt", updated_at as "updatedAt", published_at as "publishedAt"`,
      [
        createPropertyDto.title,
        createPropertyDto.description || null,
        createPropertyDto.address || null,
        createPropertyDto.city || null,
        createPropertyDto.state || null,
        createPropertyDto.zipCode || null,
        createPropertyDto.price || null,
        createPropertyDto.type,
        status,
        createPropertyDto.bedrooms || null,
        createPropertyDto.bathrooms || null,
        createPropertyDto.squareFeet || null,
        createPropertyDto.lotSize || null,
        createPropertyDto.yearBuilt || null,
        userId,
        teamId,
        createPropertyDto.latitude || null,
        createPropertyDto.longitude || null,
        status === PropertyStatus.PUBLISHED ? new Date() : null,
      ],
    );

    const property = rows[0];

    // Log event
    await this.eventLogger.logPropertyCreated(property.id, userId, teamId, {
      title: property.title,
      type: property.type,
      status: property.status,
      price: property.price,
    });

    return property;
  }

  async findAll(userId: string, teamId: string | null, filters?: { type?: string; status?: string; search?: string }): Promise<Property[]> {
    let query = `SELECT id, title, description, address, city, state, zip_code as "zipCode", price, type, status,
                        bedrooms, bathrooms, square_feet as "squareFeet", lot_size as "lotSize", year_built as "yearBuilt",
                        created_by as "createdBy", edited_by as "editedBy", team_id as "teamId", zone_id as "zoneId",
                        latitude, longitude,
                        created_at as "createdAt", updated_at as "updatedAt", published_at as "publishedAt"
                 FROM properties`;
    const conditions: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (teamId) {
      conditions.push(`team_id = $${paramCount++}`);
      params.push(teamId);
    } else {
      conditions.push(`created_by = $${paramCount++}`);
      params.push(userId);
    }

    if (filters?.type) {
      conditions.push(`type = $${paramCount++}`);
      params.push(filters.type);
    }

    if (filters?.status) {
      conditions.push(`status = $${paramCount++}`);
      params.push(filters.status);
    }

    // Add text search on address, city, state, title, and description
    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(`(
        address ILIKE $${paramCount} OR
        city ILIKE $${paramCount} OR
        state ILIKE $${paramCount} OR
        title ILIKE $${paramCount} OR
        description ILIKE $${paramCount} OR
        zip_code ILIKE $${paramCount}
      )`);
      params.push(searchTerm);
      paramCount++;
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY created_at DESC`;

    const { rows } = await this.db.query(query, params);
    return rows;
  }

  async findPublic(filters?: { type?: string; search?: string }): Promise<Property[]> {
    let query = `SELECT id, title, description, address, city, state, zip_code as "zipCode", price, type, status,
                        bedrooms, bathrooms, square_feet as "squareFeet", lot_size as "lotSize", year_built as "yearBuilt",
                        created_by as "createdBy", edited_by as "editedBy", team_id as "teamId", zone_id as "zoneId",
                        latitude, longitude,
                        created_at as "createdAt", updated_at as "updatedAt", published_at as "publishedAt"
                 FROM properties`;
    const conditions: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    // Only published properties
    conditions.push(`status = $${paramCount++}`);
    params.push(PropertyStatus.PUBLISHED);

    if (filters?.type) {
      conditions.push(`type = $${paramCount++}`);
      params.push(filters.type);
    }

    // Add text search on address, city, state, title, and description
    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(`(
        address ILIKE $${paramCount} OR
        city ILIKE $${paramCount} OR
        state ILIKE $${paramCount} OR
        title ILIKE $${paramCount} OR
        description ILIKE $${paramCount} OR
        zip_code ILIKE $${paramCount}
      )`);
      params.push(searchTerm);
      paramCount++;
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY published_at DESC, created_at DESC`;

    const { rows } = await this.db.query(query, params);
    return rows;
  }

  async findByBbox(
    userId: string,
    teamId: string | null,
    bbox: { west: number; south: number; east: number; north: number },
    filters?: { type?: string; status?: string; search?: string },
  ): Promise<Property[]> {
    let query = `SELECT id, title, description, address, city, state, zip_code as "zipCode", price, type, status,
                        bedrooms, bathrooms, square_feet as "squareFeet", lot_size as "lotSize", year_built as "yearBuilt",
                        created_by as "createdBy", edited_by as "editedBy", team_id as "teamId", zone_id as "zoneId",
                        latitude, longitude,
                        created_at as "createdAt", updated_at as "updatedAt", published_at as "publishedAt"
                 FROM properties`;
    const conditions: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (teamId) {
      conditions.push(`team_id = $${paramCount++}`);
      params.push(teamId);
    } else {
      conditions.push(`created_by = $${paramCount++}`);
      params.push(userId);
    }

    // Bounding box filter - only properties with coordinates within the bbox
    conditions.push(`latitude IS NOT NULL`);
    conditions.push(`longitude IS NOT NULL`);
    conditions.push(`latitude >= $${paramCount++}`);
    params.push(bbox.south);
    conditions.push(`latitude <= $${paramCount++}`);
    params.push(bbox.north);
    conditions.push(`longitude >= $${paramCount++}`);
    params.push(bbox.west);
    conditions.push(`longitude <= $${paramCount++}`);
    params.push(bbox.east);

    if (filters?.type) {
      conditions.push(`type = $${paramCount++}`);
      params.push(filters.type);
    }

    if (filters?.status) {
      conditions.push(`status = $${paramCount++}`);
      params.push(filters.status);
    }

    // Add text search on address, city, state, title, and description
    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(`(
        address ILIKE $${paramCount} OR
        city ILIKE $${paramCount} OR
        state ILIKE $${paramCount} OR
        title ILIKE $${paramCount} OR
        description ILIKE $${paramCount} OR
        zip_code ILIKE $${paramCount}
      )`);
      params.push(searchTerm);
      paramCount++;
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY created_at DESC`;

    const { rows } = await this.db.query(query, params);
    return rows;
  }

  async findById(id: string): Promise<Property | null> {
    const { rows } = await this.db.query(
      `SELECT id, title, description, address, city, state, zip_code as "zipCode", price, type, status,
              bedrooms, bathrooms, square_feet as "squareFeet", lot_size as "lotSize", year_built as "yearBuilt",
              created_by as "createdBy", edited_by as "editedBy", team_id as "teamId", zone_id as "zoneId",
              latitude, longitude,
              created_at as "createdAt", updated_at as "updatedAt", published_at as "publishedAt"
       FROM properties WHERE id = $1`,
      [id],
    );
    return rows[0] || null;
  }

  async update(id: string, updatePropertyDto: UpdatePropertyDto, userId: string, teamId: string | null): Promise<Property> {
    const property = await this.findById(id);
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Check permissions: user must be creator or team member
    const isCreator = String(property.createdBy) === String(userId);
    const isTeamMember = property.teamId && teamId && String(property.teamId) === String(teamId);
    
    if (!isCreator && !isTeamMember) {
      throw new ForbiddenException('You do not have permission to update this property');
    }

    const oldStatus = property.status;
    const wasPublished = property.status === PropertyStatus.PUBLISHED;

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updatePropertyDto.title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(updatePropertyDto.title);
    }
    if (updatePropertyDto.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(updatePropertyDto.description);
    }
    if (updatePropertyDto.address !== undefined) {
      updates.push(`address = $${paramCount++}`);
      values.push(updatePropertyDto.address);
    }
    if (updatePropertyDto.city !== undefined) {
      updates.push(`city = $${paramCount++}`);
      values.push(updatePropertyDto.city);
    }
    if (updatePropertyDto.state !== undefined) {
      updates.push(`state = $${paramCount++}`);
      values.push(updatePropertyDto.state);
    }
    if (updatePropertyDto.zipCode !== undefined) {
      updates.push(`zip_code = $${paramCount++}`);
      values.push(updatePropertyDto.zipCode);
    }
    if (updatePropertyDto.price !== undefined) {
      updates.push(`price = $${paramCount++}`);
      values.push(updatePropertyDto.price);
    }
    if (updatePropertyDto.type !== undefined) {
      updates.push(`type = $${paramCount++}`);
      values.push(updatePropertyDto.type);
    }
    if (updatePropertyDto.status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(updatePropertyDto.status);
      
      // Set published_at when status changes to published
      if (updatePropertyDto.status === PropertyStatus.PUBLISHED && property.status !== PropertyStatus.PUBLISHED) {
        updates.push(`published_at = NOW()`);
      }
    }
    if (updatePropertyDto.bedrooms !== undefined) {
      updates.push(`bedrooms = $${paramCount++}`);
      values.push(updatePropertyDto.bedrooms);
    }
    if (updatePropertyDto.bathrooms !== undefined) {
      updates.push(`bathrooms = $${paramCount++}`);
      values.push(updatePropertyDto.bathrooms);
    }
    if (updatePropertyDto.squareFeet !== undefined) {
      updates.push(`square_feet = $${paramCount++}`);
      values.push(updatePropertyDto.squareFeet);
    }
    if (updatePropertyDto.lotSize !== undefined) {
      updates.push(`lot_size = $${paramCount++}`);
      values.push(updatePropertyDto.lotSize);
    }
    if (updatePropertyDto.yearBuilt !== undefined) {
      updates.push(`year_built = $${paramCount++}`);
      values.push(updatePropertyDto.yearBuilt);
    }
    if (updatePropertyDto.latitude !== undefined) {
      updates.push(`latitude = $${paramCount++}`);
      values.push(updatePropertyDto.latitude);
    }
    if (updatePropertyDto.longitude !== undefined) {
      updates.push(`longitude = $${paramCount++}`);
      values.push(updatePropertyDto.longitude);
    }

    if (updates.length === 0) {
      return property;
    }

    // Track who edited the property
    updates.push(`edited_by = $${paramCount++}`);
    values.push(userId);
    updates.push(`updated_at = NOW()`);
    values.push(id);

    const { rows } = await this.db.query(
      `UPDATE properties SET ${updates.join(', ')} WHERE id = $${paramCount}
       RETURNING id, title, description, address, city, state, zip_code as "zipCode", price, type, status,
                 bedrooms, bathrooms, square_feet as "squareFeet", lot_size as "lotSize", year_built as "yearBuilt",
                 created_by as "createdBy", edited_by as "editedBy", team_id as "teamId", latitude, longitude,
                 created_at as "createdAt", updated_at as "updatedAt", published_at as "publishedAt"`,
      values,
    );

    const updatedProperty = rows[0];

    // Log status change if status was updated
    if (updatePropertyDto.status !== undefined && updatePropertyDto.status !== oldStatus) {
      await this.eventLogger.logPropertyStatusChanged(updatedProperty.id, userId, teamId, oldStatus, updatePropertyDto.status);
      
      // Log publish event if status changed to published
      if (updatePropertyDto.status === PropertyStatus.PUBLISHED && !wasPublished) {
        await this.eventLogger.logPropertyPublished(updatedProperty.id, userId, teamId);
      }
    }

    return updatedProperty;
  }

  async publish(id: string, userId: string, teamId: string | null): Promise<Property> {
    const property = await this.findById(id);
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const result = await this.update(id, { status: PropertyStatus.PUBLISHED }, userId, teamId);
    
    // Log publish event (update method already logs status change, but we also want explicit publish event)
    if (property.status !== PropertyStatus.PUBLISHED) {
      await this.eventLogger.logPropertyPublished(result.id, userId, teamId);
    }

    return result;
  }

  async delete(id: string, userId: string, teamId: string | null): Promise<void> {
    const property = await this.findById(id);
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Check permissions: user must be creator
    if (String(property.createdBy) !== String(userId)) {
      throw new ForbiddenException('You do not have permission to delete this property');
    }

    await this.db.query('DELETE FROM properties WHERE id = $1', [id]);
  }

  async addMedia(propertyId: string, url: string, type: 'image' | 'video' | 'document' = 'image', isPrimary: boolean = false, userId: string, teamId: string | null): Promise<PropertyMedia> {
    // Verify property exists and user has permission
    const property = await this.findById(propertyId);
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Check permissions: user must be creator or team member
    const isCreator = String(property.createdBy) === String(userId);
    const isTeamMember = property.teamId && teamId && String(property.teamId) === String(teamId);
    
    if (!isCreator && !isTeamMember) {
      throw new ForbiddenException('You do not have permission to add media to this property');
    }

    // If this is primary, unset other primary media
    if (isPrimary) {
      await this.db.query(
        `UPDATE property_media SET is_primary = false WHERE property_id = $1`,
        [propertyId],
      );
    }

    const { rows } = await this.db.query(
      `INSERT INTO property_media (property_id, url, type, is_primary, display_order, created_at)
       VALUES ($1, $2, $3, $4, (SELECT COALESCE(MAX(display_order), 0) + 1 FROM property_media WHERE property_id = $1), NOW())
       RETURNING id, property_id as "propertyId", url, type, is_primary as "isPrimary", display_order as "displayOrder", created_at as "createdAt"`,
      [propertyId, url, type, isPrimary],
    );

    return rows[0];
  }

  async getMedia(propertyId: string): Promise<PropertyMedia[]> {
    const { rows } = await this.db.query(
      `SELECT id, property_id as "propertyId", url, type, is_primary as "isPrimary", display_order as "displayOrder", created_at as "createdAt"
       FROM property_media
       WHERE property_id = $1
       ORDER BY is_primary DESC, display_order ASC`,
      [propertyId],
    );
    return rows;
  }

  async updateMedia(mediaId: string, updateData: { isPrimary?: boolean; displayOrder?: number }, userId: string, teamId: string | null): Promise<PropertyMedia> {
    // Get media to find property
    const { rows } = await this.db.query(
      `SELECT pm.*, p.created_by as "propertyCreatedBy", p.team_id as "propertyTeamId"
       FROM property_media pm
       JOIN properties p ON p.id = pm.property_id
       WHERE pm.id = $1`,
      [mediaId],
    );

    if (rows.length === 0) {
      throw new NotFoundException('Media not found');
    }

    const media = rows[0];

    // Check permissions: user must be creator or team member
    const isCreator = String(media.propertyCreatedBy) === String(userId);
    const isTeamMember = media.propertyTeamId && teamId && String(media.propertyTeamId) === String(teamId);
    
    if (!isCreator && !isTeamMember) {
      throw new ForbiddenException('You do not have permission to update this media');
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updateData.isPrimary !== undefined) {
      updates.push(`is_primary = $${paramCount++}`);
      values.push(updateData.isPrimary);

      // If setting as primary, unset other primary media for this property
      if (updateData.isPrimary) {
        await this.db.query(
          `UPDATE property_media SET is_primary = false WHERE property_id = (SELECT property_id FROM property_media WHERE id = $1) AND id != $1`,
          [mediaId],
        );
      }
    }

    if (updateData.displayOrder !== undefined) {
      updates.push(`display_order = $${paramCount++}`);
      values.push(updateData.displayOrder);
    }

    if (updates.length === 0) {
      return {
        id: media.id,
        propertyId: media.property_id,
        url: media.url,
        type: media.type,
        isPrimary: media.is_primary,
        displayOrder: media.display_order,
        createdAt: media.created_at,
      };
    }

    values.push(mediaId);

    const { rows: updatedRows } = await this.db.query(
      `UPDATE property_media SET ${updates.join(', ')} WHERE id = $${paramCount}
       RETURNING id, property_id as "propertyId", url, type, is_primary as "isPrimary", display_order as "displayOrder", created_at as "createdAt"`,
      values,
    );

    return updatedRows[0];
  }

  async deleteMedia(mediaId: string, userId: string, teamId: string | null): Promise<void> {
    // Get media to find property and check permissions
    const { rows } = await this.db.query(
      `SELECT pm.*, p.created_by as "propertyCreatedBy", p.team_id as "propertyTeamId"
       FROM property_media pm
       JOIN properties p ON p.id = pm.property_id
       WHERE pm.id = $1`,
      [mediaId],
    );

    if (rows.length === 0) {
      throw new NotFoundException('Media not found');
    }

    const media = rows[0];

    // Check permissions: user must be creator or team member
    const isCreator = String(media.propertyCreatedBy) === String(userId);
    const isTeamMember = media.propertyTeamId && teamId && String(media.propertyTeamId) === String(teamId);
    
    if (!isCreator && !isTeamMember) {
      throw new ForbiddenException('You do not have permission to delete this media');
    }

    await this.db.query('DELETE FROM property_media WHERE id = $1', [mediaId]);
  }
}

